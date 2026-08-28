// api/verify.js — Vercel Serverless (CommonJS)
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

// Selalu solve AES fresh setiap request — tidak andalkan cookie lama
async function doFetch(fetchFn, url, options = {}) {
  const baseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': BASE_URL,
    'Origin': BASE_URL,
    ...options.headers
  };

  // Step 1: request tanpa cookie dulu untuk dapat AES challenge
  let res = await fetchFn(url, { ...options, headers: baseHeaders, redirect: 'follow' });
  let text = await res.text();
  console.log('[verify] raw[:300]:', text.slice(0, 300));

  // Step 2: kalau dapat challenge, solve dan retry
  if (text.includes('slowAES') || text.includes('toNumbers') || text.includes('__test=')) {
    console.log('[verify] anti-bot detected, solving...');
    const val = solveAES(text);
    if (val) {
      testCookie = val;
      const headersWithCookie = { ...baseHeaders, 'Cookie': `__test=${val}` };
      res = await fetchFn(url, { ...options, headers: headersWithCookie, redirect: 'follow' });
      text = await res.text();
      console.log('[verify] after solve[:300]:', text.slice(0, 300));

      // Step 3: kalau masih challenge (kadang butuh 2x), solve lagi
      if (text.includes('slowAES') || text.includes('toNumbers')) {
        console.log('[verify] double challenge, solving again...');
        const val2 = solveAES(text);
        if (val2) {
          const headersWithCookie2 = { ...baseHeaders, 'Cookie': `__test=${val2}` };
          res = await fetchFn(url, { ...options, headers: headersWithCookie2, redirect: 'follow' });
          text = await res.text();
          console.log('[verify] after 2nd solve[:300]:', text.slice(0, 300));
        }
      }
    } else {
      console.log('[verify] AES solve failed, trying with stored cookie...');
      if (testCookie) {
        const headersWithCookie = { ...baseHeaders, 'Cookie': `__test=${testCookie}` };
        res = await fetchFn(url, { ...options, headers: headersWithCookie, redirect: 'follow' });
        text = await res.text();
      }
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

  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = JSON.parse(typeof body === 'string' ? body : await rawBody(req));
    } catch {
      return res.status(400).json({ ok: false, error: 'Body tidak valid.' });
    }
  }

  const { email, link } = body || {};

  if (!link) return res.status(400).json({ ok: false, error: 'Link tidak boleh kosong.' });
  if (!link.trim().startsWith('http')) return res.status(400).json({ ok: false, error: 'Link tidak valid.' });

  let fetchFn;
  try { fetchFn = await getFetch(); }
  catch (e) { return res.status(500).json({ ok: false, error: 'fetch error: ' + e.message }); }

  try {
    const text = await doFetch(fetchFn, `${BASE_URL}/index.php?action=verify_eceran`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ email: (email || '').trim(), link: link.trim() })
    });

    let data;
    try { data = JSON.parse(text.trim()); } catch {
      return res.status(502).json({ ok: false, error: 'Response tidak valid: ' + text.slice(0, 150) });
    }

    console.log('[verify] parsed data:', JSON.stringify(data));

    // cek semua kemungkinan field sukses dari server
    const ok =
      data?.success === true ||
      data?.ok === true ||
      data?.status === 'success' ||
      data?.status === 'active' ||
      data?.message?.toLowerCase().includes('berhasil') ||
      data?.message?.toLowerCase().includes('success') ||
      data?.message?.toLowerCase().includes('aktif') ||
      data?.message?.toLowerCase().includes('verified');

    if (ok) {
      return res.status(200).json({
        ok: true,
        message: data.message || 'Premium berhasil diaktifkan!',
        data: { duration: data?.duration || '1 Year', status: 'active' }
      });
    }

    return res.status(200).json({ ok: false, error: data.message || data.error || 'Verifikasi gagal.' });

  } catch (err) {
    console.error('[verify] error:', err.message);
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
