# Free AM — Alight Motion Premium Generator

> **by dapjisync** · wa.me/dapjisync 
> **WebAmPrem** · dapjimotionpro.my.id  
> **Wajib Join** · whatsapp.com/channel/0029Vb8eF98C6Zvj3ZWrqu1Y

Website aktivasi Alight Motion Premium gratis. Neo-Brutalism UI, Generator V1.0, 2 langkah.

---

## Struktur File

```
free-am/
├── index.html        ← halaman utama (rename brand di sini)
├── style.css         ← semua styling & warna
├── app.js            ← logic frontend
├── api/
│   ├── send.js       ← serverless: kirim magic link ke email
│   └── verify.js     ← serverless: verifikasi magic link
├── vercel.json       ← konfigurasi routing Vercel
└── README.md         ← dokumentasi ini
```

---

## Cara Rename / Rebrand

Semua yang perlu diganti ada di 3 file: `index.html`, `style.css`, dan `api/send.js` + `api/verify.js`.

---

### 1. Nama brand di chip pojok kiri

Buka `index.html`, cari:

```html
<span>FREE AM</span>
```

Ganti jadi nama brand lu:

```html
<span>NAMA LU</span>
```

---

### 2. Title tab browser

Masih di `index.html`, cari:

```html
<title>Free AM — Alight Motion Premium</title>
```

Ganti:

```html
<title>Nama Lu — Alight Motion Premium</title>
```

---

### 3. Footer bawah halaman

Cari:

```html
<footer>FREE AM • PREMIUM GENERATOR V1.0 • ALL RIGHTS RESERVED</footer>
```

Ganti teks `FREE AM` sesuai nama brand lu.

---

### 4. Watermark

Cari:

```html
<div class="watermark" aria-label="Watermark">POWERED BY DAPJISYNC</div>
```

Ganti teksnya:

```html
<div class="watermark" aria-label="Watermark">POWERED BY NAMA KAMU</div>
```

---

### 5. Teks Activity Log saat halaman dibuka

Cari:

```html
<pre id="log">[SYSTEM] Free AM ready.
```

Ganti `Free AM` jadi nama brand lu:

```html
<pre id="log">[SYSTEM] Nama Lu ready.
```

---

### 6. Warna & tampilan

Semua warna utama ada di bagian `:root` di `style.css`:

```css
:root {
  --bg: #f3f0e8;       /* background halaman */
  --paper: #fffdf8;    /* background card */
  --ink: #171717;      /* warna teks & border */
  --accent: #b9ff4a;   /* hijau neon (tombol GRATIS, sukses) */
  --purple: #8b5cf6;   /* shadow tombol utama */
  --yellow: #ffd84d;   /* background chip FREE AM */
  --cyan: #74e7ff;     /* shadow activity log */
}
```

Tinggal ganti hex-nya sesuai selera.

---

## Ganti API (Ganti Source Generator)

API yang dipakai ada di 2 file: `api/send.js` dan `api/verify.js`.

### Ganti kondisi sukses

Kedua file menentukan sukses/gagal dengan cek ini:

**send.js:**
```js
const ok =
  data?.success === true ||
  data?.message?.toLowerCase().includes('berhasil') ||
  data?.message?.toLowerCase().includes('terkirim') ||
  data?.message?.toLowerCase().includes('sent');
```

**verify.js:**
```js
const ok =
  data?.success === true ||
  data?.message?.toLowerCase().includes('berhasil') ||
  data?.message?.toLowerCase().includes('success') ||
  data?.message?.toLowerCase().includes('aktif');
```

Kalau API baru lu return format response yang beda, sesuaikan kondisi `ok` di sini.

---

## Setup & Deploy

### Deploy ke Vercel (Recommended)

1. Upload folder project ke GitHub
2. Import di [vercel.com](https://vercel.com)
3. Tidak perlu build command — langsung deploy
4. Done

Atau pakai CLI:

```bash
npm i -g vercel
cd folder-project
vercel
```

---

### Deploy ke Netlify

1. Drag & drop folder ke [netlify.com](https://netlify.com)
2. Publish directory: `.` (titik = root folder)
3. Done

> **Catatan:** Netlify Functions butuh setup tambahan untuk `api/*.js`. Untuk kemudahan, pakai Vercel.

---

## Cara Kerja API

### `POST /api/send`

Menerima email, lalu menghubungi `alight-motion-premium.site.je` untuk mengirim magic link ke email user.

**Request body:**
```json
{ "email": "user@gmail.com" }
```

**Response sukses:**
```json
{ "ok": true, "message": "Magic link berhasil dikirim!" }
```

**Response gagal:**
```json
{ "ok": false, "error": "Gagal mengirim magic link." }
```

---

### `POST /api/verify`

Menerima email + magic link, lalu memverifikasi ke server untuk mengaktifkan premium.

**Request body:**
```json
{
  "email": "user@gmail.com",
  "link": "https://alight-creative.firebaseapp.com/__/auth/..."
}
```

**Response sukses:**
```json
{
  "ok": true,
  "message": "Premium berhasil diaktifkan!",
  "data": { "duration": "1 Year", "status": "active" }
}
```

**Response gagal:**
```json
{ "ok": false, "error": "Verifikasi gagal." }
```

---

## Catatan Teknis

- Kedua API file menggunakan **CommonJS** (`module.exports`, `require`) — **jangan** ganti ke ESM (`export default`, `import`) karena akan error di Vercel.
- Ada **AES cookie solver** bawaan di kedua file untuk bypass proteksi DDoS di server target. Kalau API baru lu tidak pakai proteksi ini, bagian `solveAES` dan `doFetch` bisa dibiarkan tidak akan mengganggu.
- Tidak ada data user yang disimpan permanen di server.

---

## Lisensi

Bebas digunakan, dimodifikasi, dan didistribusikan. Rename sesuai kebutuhan project lu.
