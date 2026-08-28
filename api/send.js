// api/send.js — Vercel Serverless (CommonJS)
const crypto = require('crypto');
const BASE_URL = 'https://alight-motion-premium.site.je';

let testCookie = '';

function solveAES(html) {
  try {
    const a = html.match(/var a=toNumbers\("([a-f0-9]+)"\)/i)?.[1];
    const b = html.match(/b=toNumbers\("([a-f0-9]+)"\)/i)?.[1];
    const c = html.match(/c=toNumbers\("([a-f0-9]+)"\)/i)?.[1];
    if (!a || !b || !c) return null;
    const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
    decipher.setAutoPadding(false);
    return Buffer.concat([decipher.update(Buffer.from(c, 'hex')), decipher.final()]).toString('hex');
  } catch { return null; }
}

async function getFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  const { default: nodeFetch } = await import('node-fetch');
  return nodeFetch;
}

async function doFetch(fetchFn, url, options = {}) {
  options.headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': BASE_URL,
    'Origin': BASE_URL,
    ...(testCookie ? { 'Cookie': `__test=${testCookie}` } : {}),
    ...options.headers
  };

  let res = await fetchFn(url, { ...options, redirect: 'follow' });
  let text = await res.text();
  console.log('[send] raw[:300]:', text.slice(0, 300));

  if (text.includes('slowAES') || text.includes('toNumbers') || text.includes('__test=')) {
    console.log('[send] anti-bot detected, solving AES...');
    const val = solveAES(text);
    if (val) {
      testCookie = val;
      options.headers['Cookie'] = `__test=${testCookie}`;
      res = await fetchFn(url, { ...options, redirect: 'follow' });
      text = await res.text();
      console.log('[send] after solve[:300]:', text.slice(0, 300));
    } else {
      console.log('[send] AES solve failed');
    }
  }

  return text;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  // parse body manual kalau req.body undefined
  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = JSON.parse(typeof body === 'string' ? body : await rawBody(req));
    } catch {
      return res.status(400).json({ ok: false, error: 'Body tidak valid.' });
    }
  }

  const { email } = body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ ok: false, error: 'Email tidak valid.' });
  }

  let fetchFn;
  try { fetchFn = await getFetch(); }
  catch (e) { return res.status(500).json({ ok: false, error: 'fetch error: ' + e.message }); }

  try {
    const text = await doFetch(fetchFn, `${BASE_URL}/index.php?action=send_eceran`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ email: email.trim() })
    });

    let data;
    try { data = JSON.parse(text.trim()); } catch {
      return res.status(502).json({ ok: false, error: 'Response tidak valid dari server: ' + text.slice(0, 120) });
    }

    const ok =
      data?.success === true ||
      data?.message?.toLowerCase().includes('berhasil') ||
      data?.message?.toLowerCase().includes('terkirim') ||
      data?.message?.toLowerCase().includes('sent');

    if (ok) return res.status(200).json({ ok: true, message: data.message || 'Magic link berhasil dikirim!' });
    return res.status(200).json({ ok: false, error: data.message || 'Gagal mengirim magic link.' });

  } catch (err) {
    console.error('[send] error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

async function rawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
  }
