import dotenv from 'dotenv';
dotenv.config({ override: true });
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }
  return aiClient;
}

const upload = multer({ dest: os.tmpdir() });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    year: { type: Type.STRING },
    coreMetrics: {
      type: Type.OBJECT,
      properties: {
        sales: { type: Type.NUMBER },
        orders: { type: Type.NUMBER },
        ebit: { type: Type.NUMBER },
        netIncome: { type: Type.NUMBER }
      },
      required: ['sales', 'orders', 'ebit', 'netIncome']
    },
    costDrivers: {
      type: Type.OBJECT,
      properties: {
        materials: { type: Type.NUMBER },
        personnel: { type: Type.NUMBER },
        employeesEoY: { type: Type.NUMBER },
        employeesAvg: { type: Type.NUMBER }
      },
      required: ['materials', 'personnel', 'employeesEoY', 'employeesAvg']
    },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          sales: { type: Type.NUMBER },
          ebit: { type: Type.NUMBER }
        },
        required: ['name', 'sales', 'ebit']
      }
    },
    efficiencyRatios: {
      type: Type.OBJECT,
      properties: {
        revenuePerEmployee: { type: Type.NUMBER },
        personnelCostRatio: { type: Type.NUMBER },
        ebitMargin: { type: Type.NUMBER }
      },
      required: ['revenuePerEmployee', 'personnelCostRatio', 'ebitMargin']
    },
    quarterlyData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          sales: { type: Type.NUMBER },
          ebit: { type: Type.NUMBER }
        },
        required: ['name', 'sales', 'ebit']
      }
    }
  },
  required: ['year', 'coreMetrics', 'costDrivers', 'segments', 'efficiencyRatios', 'quarterlyData']
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Verify Gemini API endpoint
  app.get('/api/verify-gemini', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ success: false, error: 'GEMINI_API_KEY environment variable is not set.' });
      }
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'reply "ok" if you receive this',
      });
      res.json({ success: true, message: 'Gemini API is working correctly.', response: response.text });
    } catch (error: any) {
      console.error('Error verifying Gemini API:', error);
      res.status(500).json({ success: false, error: 'API verification failed: ' + (error?.message || error) });
    }
  });

  // Chunked upload to bypass 32MB NGINX limit
  app.post('/api/upload-chunk', express.raw({ limit: '10mb', type: 'application/octet-stream' }), (req: Request, res: Response) => {
    try {
      const fileId = req.headers['x-file-id'] as string;
      if (!fileId) {
        res.status(400).json({ error: 'Missing x-file-id header' });
        return;
      }
      const safeId = fileId.replace(/[^a-zA-Z0-9_\-\.]/g, '');
      const filePath = path.join(os.tmpdir(), `chunked-${safeId}`);
      fs.appendFileSync(filePath, req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/extract-chunked', async (req: Request, res: Response) => {
    try {
      const { year, files, outputLang } = req.body;
      if (!year || !files || files.length === 0) {
        res.status(400).json({ error: 'Missing year or files' });
        return;
      }
      
      const langText = outputLang === 'DE' ? 'German' : 'English';

      console.log(`Processing ${files.length} chunked documents for year ${year}`);

      const parts: any[] = [];
      const ai = getAI();

      for (const f of files) {
        const safeId = f.id.replace(/[^a-zA-Z0-9_\-\.]/g, '');
        const filePath = path.join(os.tmpdir(), `chunked-${safeId}`);
        if (!fs.existsSync(filePath)) {
          console.error(`File missing: ${filePath}`);
          // Continue to extract from others if possible, or just fail
          continue;
        }

        console.log(`Uploading chunked file to Gemini: ${filePath}`);
        try {
          const uploadedFile = await ai.files.upload({
            file: filePath,
            config: {
              mimeType: f.mimeType === 'application/pdf' ? 'application/pdf' : 'text/plain',
              displayName: f.name
            }
          });
          parts.push({
            fileData: {
              fileUri: uploadedFile.uri,
              mimeType: uploadedFile.mimeType,
            }
          });
        } catch (uploadErr) {
          console.error('Gemini Upload Error:', uploadErr);
          throw uploadErr;
        }
      }

      if (parts.length === 0) {
        res.status(400).json({ error: 'Failed to upload any files to Gemini' });
        return;
      }

      const prompt = `Please extract the following financial metrics for the Dräger Group (Konzern) for the ${year} fiscal year.
If there are multiple years, ensure you only extract data for the year ${year}.
The input may contain the Consolidated P&L ("Konzern-Gewinn- und Verlustrechnung") and the Consolidated Balance Sheet ("Konzern-Bilanz").

IMPORTANT Guidelines:
1. Core Performance Metrics: Sales, Order Intake, EBIT, Net Profit.
2. Operational Cost Drivers: Total Materialaufwand (Total Materials Expense, which is the sum of Direct Materials and Material Overheads, usually found in Note 10 or the main P&L, NOT just 'Materialeinzelkosten'), Personnel Expenses, Employees (End of Year), Employees (Average).
3. Segments: Medical and Safety (Net sales and EBIT).
4. Efficiency Ratios: Revenue per Employee (total sales / average employees * 1,000,000 to get value in Euros), Personnel Cost Ratio (%), EBIT Margin (%).
5. Quarterly Data: Q1, Q2, Q3, Q4 Sales and EBIT values if presented. If only accumulative is present, deduce it.

Please output the extracted string labels (like segment names or quarterly names) in ${langText}.
Format all numbers as numeric values in millions of Euros, except for Revenue per Employee which should be in exact Euros.

If the document doesn't strictly contain Drager Group data, do your best to extract the equivalent data from whatever report is provided for the year ${year}.`;

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        }
      });

      const extractedData = JSON.parse(response.text || '{}');
      res.json(extractedData);

    } catch (error: any) {
      console.error('Error extracting chunked data:', error);
      res.status(500).json({ error: 'Failed to extract data: ' + (error?.message || error) });
    } finally {
      // Cleanup
      const { files } = req.body || {};
      if (files && Array.isArray(files)) {
        for (const f of files) {
          const safeId = f.id.replace(/[^a-zA-Z0-9_\-\.]/g, '');
          const filePath = path.join(os.tmpdir(), `chunked-${safeId}`);
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch(e) {
            console.error('Failed to delete chunked file', e);
          }
        }
      }
    }
  });

  // Extractor endpoint (legacy fallback if needed)
  app.post('/api/extract', (req: Request, res: Response) => {
    upload.array('documents')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      let localFiles: Express.Multer.File[] = [];

      try {
        localFiles = req.files as Express.Multer.File[] || [];
        const { year, outputLang } = req.body;
        
        const langText = outputLang === 'DE' ? 'German' : 'English';

        if (localFiles.length === 0) {
          res.status(400).json({ error: 'No files uploaded' });
          return;
        }
        if (!year) {
          res.status(400).json({ error: 'Year not provided' });
          return;
        }

        console.log(`Processing ${localFiles.length} documents for year ${year}`);

        // Ask Gemini to extract data
        const parts: any[] = [];
        const ai = getAI();

        for (const file of localFiles) {
          console.log(`Uploading file to Gemini: ${file.path}`);
          const uploadedFile = await ai.files.upload({
            file: file.path,
            config: {
              mimeType: file.mimetype === 'application/pdf' ? 'application/pdf' : 'text/plain',
            }
          });
          parts.push({
            fileData: {
              fileUri: uploadedFile.uri,
              mimeType: uploadedFile.mimeType,
            }
          });
        }

        const prompt = `Please extract the following financial metrics for the Dräger Group (Konzern) for the ${year} fiscal year.
If there are multiple years, ensure you only extract data for the year ${year}.
The input may contain the Consolidated P&L ("Konzern-Gewinn- und Verlustrechnung") and the Consolidated Balance Sheet ("Konzern-Bilanz").

IMPORTANT Guidelines:
1. Core Performance Metrics: Sales, Order Intake, EBIT, Net Profit.
2. Operational Cost Drivers: Total Materialaufwand (Total Materials Expense, which is the sum of Direct Materials and Material Overheads, usually found in Note 10 or the main P&L, NOT just 'Materialeinzelkosten'), Personnel Expenses, Employees (End of Year), Employees (Average).
3. Segments: Medical and Safety (Net sales and EBIT).
4. Efficiency Ratios: Revenue per Employee (total sales / average employees * 1,000,000 to get value in Euros), Personnel Cost Ratio (%), EBIT Margin (%).
5. Quarterly Data: Q1, Q2, Q3, Q4 Sales and EBIT values if presented. If only accumulative is present, deduce it.

Please output the extracted string labels (like segment names or quarterly names) in ${langText}.
Format all numbers as numeric values in millions of Euros, except for Revenue per Employee which should be in exact Euros.

If the document doesn't strictly contain Drager Group data, do your best to extract the equivalent data from whatever report is provided for the year ${year}.`;

        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          }
        });

        const extractedData = JSON.parse(response.text || '{}');
        res.json(extractedData);

      } catch (error: any) {
        console.error('Error extracting data:', error);
        res.status(500).json({ error: 'Failed to extract data: ' + (error?.message || error) });
      } finally {
        for (const file of localFiles) {
          try {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          } catch(e) {
            console.error('Failed to delete local file', e);
          }
        }
      }
    });
  });

  // Serve Vite in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
