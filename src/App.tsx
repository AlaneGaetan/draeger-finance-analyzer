/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, BriefcaseMedical, ShieldAlert, DollarSign, 
  Users, Activity, BarChart3, Download, UploadCloud, Plus, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  LineChart, Line, ComposedChart
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initial Data Extracts for Dräger Group 2025
const initialReport = {
  year: '2025',
  coreMetrics: { sales: 3481.9, orders: 3569.4, ebit: 233.4, netIncome: 140.4 },
  costDrivers: { materials: 1075.3, personnel: 1425.5, employeesEoY: 16687, employeesAvg: 16650 },
  segments: [
    { name: 'Medical', sales: 1995.6, ebit: 57.0 },
    { name: 'Safety', sales: 1486.3, ebit: 176.4 }
  ],
  efficiencyRatios: { revenuePerEmployee: 209123, personnelCostRatio: 40.9, ebitMargin: 6.7 },
  quarterlyData: [
    { name: 'Q1', sales: 730.3, ebit: 0.4 },
    { name: 'Q2', sales: 779.9, ebit: 20.0 },
    { name: 'Q3', sales: 833.3, ebit: 56.7 },
    { name: 'Q4', sales: 1138.4, ebit: 156.3 },
  ]
};

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const translations = {
  EN: {
    title: 'Dräger Group Financials',
    subtitle: 'Consolidated P&L and Balance Sheet Extraction',
    report: 'Report',
    newReport: 'New Report',
    exportCSV: 'Export CSV',
    tab1: '1 & 4. Metrics & Ratios',
    tab2: '2. Cost Drivers',
    tab3: '3. Segments',
    tab4: '5. Quarters',
    
    metricsTitle: '1. Core Performance Metrics (Time-Series Essentials)',
    netSales: 'Net Sales',
    orderIntake: 'Order Intake',
    ebit: 'EBIT',
    netProfit: 'Net Profit',
    ratiosTitle: '4. Efficiency Ratios',
    revPerEmp: 'Revenue per Employee',
    costRatio: 'Personnel Cost Ratio',
    ebitMargin: 'EBIT Margin',
    
    costsTitle: '2. Operational Cost Drivers',
    finCosts: 'Financial Costs',
    materials: 'Cost of Materials',
    personnel: 'Personnel Expenses',
    headcount: 'Headcount',
    avgEmp: 'Average Employees',
    eoyEmp: 'End of Year (Stichtag)',
    
    segmentsTitle: '3. Segment Data',
    division: 'Division',
    revenue: 'Revenue',
    revSplit: 'Revenue Split',
    
    quartersTitle: '5. High-Frequency Check (Quarterly Resolution)',
    quarter: 'Quarter',
    fyTotal: 'FY Total',
    qProgression: 'Quarterly Progression',
    
    extractNew: 'Extract New Report',
    finYear: 'Financial Year',
    finDocs: 'Financial Documents (PDF)',
    clickDrag: 'Click or drag and drop',
    upTo20MB: 'PDF or Text files up to 20MB',
    selected: 'Selected',
    cancel: 'Cancel',
    extractData: 'Extract Data',
    processing: 'Processing...'
  },
  DE: {
    title: 'Dräger Group Finanzberichte',
    subtitle: 'Konsolidierte GuV- und Bilanzen-Extraktion',
    report: 'Bericht',
    newReport: 'Neuer Bericht',
    exportCSV: 'CSV Exportieren',
    tab1: '1 & 4. Kennzahlen & Ratios',
    tab2: '2. Kostentreiber',
    tab3: '3. Segmente',
    tab4: '5. Quartale',
    
    metricsTitle: '1. Kernleistungskennzahlen (Zeitreihen-Wesentliches)',
    netSales: 'Nettoumsatz',
    orderIntake: 'Auftragseingang',
    ebit: 'EBIT',
    netProfit: 'Jahresüberschuss',
    ratiosTitle: '4. Effizienzkennzahlen',
    revPerEmp: 'Umsatz pro Mitarbeiter',
    costRatio: 'Personalaufwandsquote',
    ebitMargin: 'EBIT-Marge',
    
    costsTitle: '2. Operative Kostentreiber',
    finCosts: 'Finanzielle Kosten',
    materials: 'Materialaufwand',
    personnel: 'Personalaufwand',
    headcount: 'Personalstand',
    avgEmp: 'Durchschnittliche Mitarbeiter',
    eoyEmp: 'Mitarbeiter (Stichtag)',
    
    segmentsTitle: '3. Segmentdaten',
    division: 'Sparte',
    revenue: 'Umsatz',
    revSplit: 'Umsatzaufteilung',
    
    quartersTitle: '5. Hochfrequenz-Check (Quartalsauflösung)',
    quarter: 'Quartal',
    fyTotal: 'GJ Gesamt',
    qProgression: 'Quartalsentwicklung',

    extractNew: 'Neuen Bericht extrahieren',
    finYear: 'Geschäftsjahr',
    finDocs: 'Finanzdokumente (PDF)',
    clickDrag: 'Klicken oder ziehen und ablegen',
    upTo20MB: 'PDF- oder Textdateien bis zu 20 MB',
    selected: 'Ausgewählt',
    cancel: 'Abbrechen',
    extractData: 'Daten extrahieren',
    processing: 'Verarbeitung...'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'costs' | 'segments' | 'quarters'>('metrics');
  const [reports, setReports] = useState<any[]>([initialReport]);
  const [activeYear, setActiveYear] = useState<string>('2025');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadYear, setUploadYear] = useState('');
  const [outputLang, setOutputLang] = useState<'EN' | 'DE'>('EN');
  const [files, setFiles] = useState<File[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('draeger-reports');
    if (saved) {
      setReports(JSON.parse(saved));
    } else {
      localStorage.setItem('draeger-reports', JSON.stringify([initialReport]));
    }
  }, []);

  const saveReports = (newReports: any[]) => {
    setReports(newReports);
    localStorage.setItem('draeger-reports', JSON.stringify(newReports));
  };

  const activeReport = reports.find(r => r.year === activeYear) || reports[0];

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !uploadYear) return;

    setIsUploading(true);

    try {
      const uploadedFilesInfo = [];
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks to easily slide under 32MB NGINX limits

      for (const file of files) {
        const fileId = Math.random().toString(36).substring(2, 15) + '-' + Date.now();
        
        for (let start = 0; start < file.size; start += CHUNK_SIZE) {
          const chunk = file.slice(start, start + CHUNK_SIZE);
          
          const response = await fetch('/api/upload-chunk', {
            method: 'POST',
            headers: {
              'x-file-id': fileId,
              'Content-Type': 'application/octet-stream'
            },
            body: chunk
          });
          
          if (!response.ok) {
            const text = await response.text();
            throw new Error(`Upload of ${file.name} failed during chunking. Target size too large or connection lost. Server says: ${text.substring(0, 100)}`);
          }
        }
        
        uploadedFilesInfo.push({
          id: fileId,
          name: file.name,
          mimeType: file.type || 'application/pdf'
        });
      }

      // Instruct server to extract using the assembled chunked files
      const extractResponse = await fetch('/api/extract-chunked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: uploadYear,
          outputLang,
          files: uploadedFilesInfo
        }),
      });

      if (!extractResponse.ok) {
        const text = await extractResponse.text();
        throw new Error(`Extraction failed (${extractResponse.status}): ${text.substring(0, 50)}...`);
      }

      const text = await extractResponse.text();
      
      // Check if we received an HTML response by mistake (e.g. Nginx 504 Timeout)
      if (text.trim().toLowerCase().startsWith('<!doctype html>')) {
        throw new Error('Upload failed: The server returned an HTML page. The PDF might be too large and took longer than 60 seconds to process (Gateway Timeout).');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", text.substring(0, 100));
        throw new Error('Server returned an invalid format: ' + text.substring(0, 50));
      }
      
      const newReports = [...reports.filter(r => r.year !== data.year), data].sort((a, b) => b.year.localeCompare(a.year));
      saveReports(newReports);
      setActiveYear(data.year);
      setShowUploadModal(false);
      setFiles([]);
      setUploadYear('');
    } catch (err: any) {
      console.error('Upload flow error:', err);
      alert(err.message || 'Failed to extract data. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const verifyApiKey = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const response = await fetch('/api/verify-gemini');
      const data = await response.json();
      if (data.success) {
        setVerificationResult({ success: true, message: 'Success: ' + data.message + '\nResponse: ' + data.response });
      } else {
        setVerificationResult({ success: false, message: 'Verification Failed: ' + data.error });
      }
    } catch (err: any) {
      setVerificationResult({ success: false, message: 'Request error: ' + (err.message || String(err)) });
    } finally {
      setIsVerifying(false);
    }
  };

  const t = translations[outputLang];

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Core Metrics
    csvContent += `1. Core Performance Metrics (${activeReport.year})\n`;
    csvContent += "Metric,Value\n";
    csvContent += `Net Sales (m €),${activeReport.coreMetrics.sales}\n`;
    csvContent += `Order Intake (m €),${activeReport.coreMetrics.orders}\n`;
    csvContent += `EBIT (m €),${activeReport.coreMetrics.ebit}\n`;
    csvContent += `Net Profit (m €),${activeReport.coreMetrics.netIncome}\n\n`;

    // Cost Drivers
    csvContent += "2. Operational Cost Drivers\n";
    csvContent += "Metric,Value\n";
    csvContent += `Cost of Materials (m €),${activeReport.costDrivers.materials}\n`;
    csvContent += `Personnel Expenses (m €),${activeReport.costDrivers.personnel}\n`;
    csvContent += `Average Employees,${activeReport.costDrivers.employeesAvg}\n`;
    csvContent += `End of Year Employees,${activeReport.costDrivers.employeesEoY}\n\n`;

    // Segments
    csvContent += "3. Segment Data\n";
    csvContent += "Segment,Revenue (m €),EBIT (m €)\n";
    activeReport.segments.forEach((seg: any) => {
      csvContent += `${seg.name},${seg.sales},${seg.ebit}\n`;
    });
    csvContent += "\n";

    // Efficiency Ratios
    csvContent += "4. Efficiency Ratios\n";
    csvContent += "Metric,Value\n";
    csvContent += `Revenue per Employee (€),${activeReport.efficiencyRatios.revenuePerEmployee}\n`;
    csvContent += `Personnel Cost Ratio (%),${activeReport.efficiencyRatios.personnelCostRatio}\n`;
    csvContent += `EBIT Margin (%),${activeReport.efficiencyRatios.ebitMargin}\n\n`;

    // Quarters
    csvContent += "5. Quarterly Data\n";
    csvContent += "Quarter,Revenue (m €),EBIT (m €)\n";
    activeReport.quarterlyData.forEach((q: any) => {
      csvContent += `${q.name},${q.sales},${q.ebit}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `draeger_group_financials_${activeReport.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTab = () => {
    switch(activeTab) {
      case 'metrics':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">{t.metricsTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center hover:shadow-md transition">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{t.netSales}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">€{activeReport.coreMetrics.sales.toLocaleString()}m</h3>
              </Card>
              <Card className="p-6 text-center hover:shadow-md transition">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{t.orderIntake}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">€{activeReport.coreMetrics.orders.toLocaleString()}m</h3>
              </Card>
              <Card className="p-6 text-center hover:shadow-md transition">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{t.ebit}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">€{activeReport.coreMetrics.ebit.toLocaleString()}m</h3>
              </Card>
              <Card className="p-6 text-center hover:shadow-md transition">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{t.netProfit}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">€{activeReport.coreMetrics.netIncome.toLocaleString()}m</h3>
              </Card>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 pt-6">{t.ratiosTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><TrendingUp /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t.revPerEmp}</p>
                  <p className="text-2xl font-bold text-gray-900">€{activeReport.efficiencyRatios.revenuePerEmployee.toLocaleString()}</p>
                </div>
              </Card>
              <Card className="p-6 flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-lg text-purple-600"><Users /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t.costRatio}</p>
                  <p className="text-2xl font-bold text-gray-900">{activeReport.efficiencyRatios.personnelCostRatio}%</p>
                </div>
              </Card>
              <Card className="p-6 flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-lg text-green-600"><Activity /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t.ebitMargin}</p>
                  <p className="text-2xl font-bold text-gray-900">{activeReport.efficiencyRatios.ebitMargin}%</p>
                </div>
              </Card>
            </div>
          </motion.div>
        );

      case 'costs':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">{t.costsTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">{t.finCosts}</h3>
                 <div className="space-y-4">
                   <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                     <span className="text-gray-600 font-medium">{t.materials}</span>
                     <span className="text-xl font-bold text-gray-900">€{activeReport.costDrivers.materials.toLocaleString()}m</span>
                   </div>
                   <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                     <span className="text-gray-600 font-medium">{t.personnel}</span>
                     <span className="text-xl font-bold text-gray-900">€{activeReport.costDrivers.personnel.toLocaleString()}m</span>
                   </div>
                 </div>
              </Card>
              <Card className="p-6">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">{t.headcount}</h3>
                 <div className="space-y-4">
                   <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center border border-slate-100">
                     <span className="text-gray-700 font-medium">{t.avgEmp}</span>
                     <span className="text-2xl font-bold text-indigo-600">{activeReport.costDrivers.employeesAvg.toLocaleString()}</span>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center border border-slate-100">
                     <span className="text-gray-700 font-medium">{t.eoyEmp}</span>
                     <span className="text-2xl font-bold text-slate-800">{activeReport.costDrivers.employeesEoY.toLocaleString()}</span>
                   </div>
                 </div>
              </Card>
            </div>
          </motion.div>
        );

      case 'segments':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
             <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">{t.segmentsTitle}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="p-6 border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 border border-blue-100 rounded-md bg-blue-50 text-blue-600">
                      <BriefcaseMedical size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{activeReport.segments[0]?.name || 'Medical'} {t.division}</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 uppercase tracking-widest text-sm font-medium">{t.revenue}</span>
                      <span className="text-2xl font-bold text-slate-800">€{activeReport.segments[0]?.sales?.toLocaleString() || 0}m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 uppercase tracking-widest text-sm font-medium">{t.ebit}</span>
                      <span className="text-2xl font-bold text-slate-800">€{activeReport.segments[0]?.ebit?.toLocaleString() || 0}m</span>
                    </div>
                  </div>
               </Card>
               <Card className="p-6 border-l-4 border-l-orange-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 border border-orange-100 rounded-md bg-orange-50 text-orange-600">
                      <ShieldAlert size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{activeReport.segments[1]?.name || 'Safety'} {t.division}</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 uppercase tracking-widest text-sm font-medium">{t.revenue}</span>
                      <span className="text-2xl font-bold text-slate-800">€{activeReport.segments[1]?.sales?.toLocaleString() || 0}m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 uppercase tracking-widest text-sm font-medium">{t.ebit}</span>
                      <span className="text-2xl font-bold text-slate-800">€{activeReport.segments[1]?.ebit?.toLocaleString() || 0}m</span>
                    </div>
                  </div>
               </Card>
             </div>
             
             <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{t.revSplit}</h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={activeReport.segments} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                       <XAxis type="number" />
                       <YAxis type="category" dataKey="name" width={80} />
                       <Tooltip cursor={{fill: 'transparent'}} />
                       <Legend />
                       <Bar dataKey="sales" fill="#475569" name={`${t.revenue} (€m)`} radius={[0, 4, 4, 0]} />
                       <Bar dataKey="ebit" fill="#3B82F6" name="EBIT (€m)" radius={[0, 4, 4, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                </div>
             </Card>
          </motion.div>
        );

      case 'quarters':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">{t.quartersTitle}</h2>
            <Card className="p-6 overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 border-b border-slate-200">
                     <th className="py-3 px-4 font-semibold text-slate-700">{t.quarter}</th>
                     <th className="py-3 px-4 font-semibold text-slate-700">{t.revenue} (€m)</th>
                     <th className="py-3 px-4 font-semibold text-slate-700">EBIT (€m)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {activeReport.quarterlyData?.map((q: any) => (
                     <tr key={q.name} className="hover:bg-slate-50">
                       <td className="py-3 px-4 font-medium">{q.name}</td>
                       <td className="py-3 px-4">{q.sales}</td>
                       <td className="py-3 px-4">{q.ebit}</td>
                       </tr>
                   ))}
                 </tbody>
                 <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                   <tr>
                     <td className="py-3 px-4">{t.fyTotal} {activeReport.year}</td>
                     <td className="py-3 px-4">{activeReport.coreMetrics.sales}</td>
                     <td className="py-3 px-4">{activeReport.coreMetrics.ebit}</td>
                   </tr>
                 </tfoot>
               </table>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{t.qProgression}</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={activeReport.quarterlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="sales" name={`${t.revenue} (€m)`} fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Line yAxisId="right" type="monotone" dataKey="ebit" name="EBIT (€m)" stroke="#4f46e5" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans selection:bg-indigo-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-300 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-indigo-950 flex items-center gap-2">
                <DollarSign className="text-indigo-600" /> {t.title}
              </h1>
              <p className="text-sm text-slate-500 mt-1">{t.subtitle}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select 
                  className="appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  value={outputLang}
                  onChange={(e) => setOutputLang(e.target.value as 'EN' | 'DE')}
                >
                  <option value="EN">EN</option>
                  <option value="DE">DE</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <div className="relative">
                <select 
                  className="appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  value={activeYear}
                  onChange={(e) => setActiveYear(e.target.value)}
                >
                  {reports.map((r) => (
                    <option key={r.year} value={r.year}>{r.year} {t.report}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              
              <button 
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
              >
                <Plus size={16} />
                {t.newReport}
              </button>

              <button 
                onClick={verifyApiKey}
                disabled={isVerifying}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm disabled:opacity-50"
              >
                {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                Verify Key
              </button>

              <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
              >
                <Download size={16} />
                {t.exportCSV}
              </button>
            </div>
          </div>
          
          {verificationResult && (
            <div className={cn("p-4 rounded-lg mb-6 text-sm", verificationResult.success ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200")}>
              <div className="flex justify-between items-start">
                <pre className="whitespace-pre-wrap font-sans">{verificationResult.message}</pre>
                <button onClick={() => setVerificationResult(null)} className="text-gray-500 hover:text-gray-700">&times;</button>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto gap-8 border-b-2 border-transparent mt-2">
            {['metrics', 'costs', 'segments', 'quarters'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "pb-3 text-sm font-semibold capitalize tracking-wide whitespace-nowrap transition-all duration-200", 
                  activeTab === tab 
                    ? "text-indigo-600 border-b-2 border-indigo-600" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab === 'metrics' ? t.tab1 : 
                 tab === 'costs' ? t.tab2 : 
                 tab === 'segments' ? t.tab3 : t.tab4}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {renderTab()}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t.extractNew}</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.finYear}</label>
                <input 
                  type="text" 
                  pattern="[0-9]{4}"
                  title="Four digit year"
                  required
                  value={uploadYear}
                  onChange={e => setUploadYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.finDocs}</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-slate-50 transition-colors relative min-h-[140px]">
                  <UploadCloud size={32} className="mb-2" />
                  <span className="text-sm">{t.clickDrag}</span>
                  <p className="text-xs text-slate-400 mt-1">{t.upTo20MB}</p>
                  <input 
                    type="file" 
                    accept=".pdf,.txt"
                    multiple
                    required
                    onChange={e => {
                      if (e.target.files) {
                        setFiles(Array.from(e.target.files));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {files.length > 0 && <p className="mt-2 text-sm text-indigo-600 font-medium z-10">{t.selected}: {files.length} file(s)</p>}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg relative z-20"
                  disabled={isUploading}
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading || files.length === 0 || !uploadYear}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 relative z-20"
                >
                  {isUploading ? <><Loader2 size={16} className="animate-spin" /> {t.processing}</> : t.extractData}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}


