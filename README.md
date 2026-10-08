# Mail Center

Dashboard pribadi untuk mengirim email lewat akun Gmail (Next.js 14 App Router + TypeScript + Nodemailer). Untuk pengiriman yang sah dan berizin; ada batas aman: loop maks 2 per penerima, maks 10 penerima, maks 20 email per proses, jeda 2-10 detik, rate limit di server.

## 1. Requirements
Node.js 18.17+ dan npm. Akun Gmail dengan Verifikasi 2 Langkah (untuk App Password).

## 2. Installation
```bash
npm install
cp .env.example .env.local
```

## 3. Environment variables
| Variabel | Fungsi |
|---|---|
| `AUTH_SECRET` | Kunci sesi login, min 32 karakter acak |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Login dashboard (admin tunggal, dibuat lewat env, tidak ada registrasi publik) |
| `ENCRYPTION_KEY` | Kunci enkripsi AES-256-GCM untuk App Password |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Penyimpanan data di Vercel (gratis) |

Buat string acak: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 4. Database setup
Tanpa konfigurasi, data disimpan di `.data/db.json` (cukup untuk development lokal). Di Vercel filesystem tidak permanen, jadi gunakan **Upstash Redis** (Vercel dashboard > Storage/Marketplace > Upstash Redis, paket gratis). Variabel `KV_REST_API_URL`/`KV_REST_API_TOKEN` yang dibuat Vercel juga dikenali. Tidak ada migrasi: data disimpan sebagai key JSON (`accounts`, `configs`, `history`). Keterbatasan: cocok untuk 1 pengguna dan data kecil (riwayat dibatasi 200 terakhir).

## 5. Local development
`npm run dev` lalu buka http://localhost:3000 dan login.

## 6. Build
`npm run build && npm start`

## 7. Deploy ke Vercel
1. Push project ke GitHub (`.env*` sudah di-ignore). 2. Import di Vercel. 3. Isi semua variabel di Settings > Environment Variables. 4. Tambahkan Upstash Redis. 5. Deploy.
Pengiriman memakai streaming dan `maxDuration = 300`. Jika paket Anda membatasi durasi fungsi lebih rendah, kecilkan jumlah penerima/jeda.

## 8. Menambahkan akun Gmail
Google Account > Keamanan > Verifikasi 2 Langkah > Sandi aplikasi > buat satu. Di menu **Akun Gmail** klik Tambah, isi email dan 16 karakter sandi. Server memverifikasi login SMTP, lalu menyimpannya terenkripsi. Sandi tidak pernah dikirim balik ke browser.

## 9. Konfigurasi dan loop
Konfigurasi menyimpan nama, penerima, subject, isi (tanpa loop). Di halaman **Kirim**, pilih "Gunakan Konfigurasi" atau isi manual. Loop default OFF; saat ON jumlah default 1 (maks 2). Backend memvalidasi ulang: loop OFF dipaksa 1.

## 10. Security notes
Semua API dan halaman butuh sesi (cookie httpOnly, JWT 7 hari). Input divalidasi dengan Zod di server. Login dibatasi 5 percobaan/10 menit, kirim 5 proses/10 menit. Error mentah hanya masuk log server.

## 11. Troubleshooting
- *Autentikasi Gmail gagal*: pastikan App Password benar dan 2FA aktif.
- *Data hilang di Vercel*: Upstash Redis belum terpasang.
- *Redirect ke /login terus*: `AUTH_SECRET` kurang dari 32 karakter.
- *Timeout*: kurangi penerima atau jeda.
