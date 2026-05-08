import fetch from 'node-fetch';

async function test() {
  const form = new FormData();
  form.append('year', '2024');
  const blob = new Blob(['dummy content for pdf'], { type: 'application/pdf' });
  form.append('documents', blob, 'dummy.pdf');
  
  try {
    const res = await fetch('http://localhost:3000/api/extract', {
      method: 'POST',
      body: form as any
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 500));
  } catch(e) {
    console.log('Fetch error:', e);
  }
}
test();
