# Deploy QuotaHub (Vercel + server)

Frontend berjalan di Vercel (HTTPS). API dan MongoDB berjalan di satu server Linux (Tencent Cloud atau setara) di belakang Caddy. Browser memblokir halaman HTTPS yang memanggil API HTTP, jadi API wajib punya sertifikat.

Perintah di bawah dijalankan di server, dari root repositori, kecuali bagian Vercel.

## 1. Pilih region dan buka firewall

Region **mainland China** mewajibkan ICP filing sebelum domain bisa dipakai publik. Region **Hong Kong** atau luar negeri tidak mewajibkan ICP.

Di security group Tencent, inbound yang dibuka:

| Port | Sumber |
| --- | --- |
| 80 | `0.0.0.0/0` (sertifikat HTTPS) |
| 443 | `0.0.0.0/0` |
| 22 | IP admin saja |

Jangan membuka port `8000` atau `27017`. Mongo tidak di-publish ke host. API hanya bisa dihubungi lewat Caddy di jaringan Docker.

Arahkan DNS `A`/`AAAA` subdomain API (misalnya `api.example.com`) ke IP server sebelum menjalankan Compose. Caddy meminta sertifikat Let's Encrypt pada boot pertama.

## 2. Pasang Docker

Pasang Docker Engine dan plugin Compose, lalu clone repositori ke server. Jangan menyalin `backend/.env` dari laptop lewat Git. File itu tidak di-commit.

## 3. Isi environment

### Rahasia aplikasi

```bash
cp backend/.env.example backend/.env
```

Isi `backend/.env`:

- `APP_MASTER_ENCRYPTION_KEY` — generate di mesin lain, simpan juga di password manager. Kalau kunci ini hilang, API key yang sudah tersimpan tidak bisa didekripsi.
- `JWT_SECRET` — string acak panjang. Proses menolak nilai kosong dan placeholder (`changeme`, `password`, `secret`, `admin`, dan daftar di `backend/app/core/config.py`).
- `DEFAULT_USERNAME` dan `DEFAULT_PASSWORD` — akun admin pertama. Password placeholder ditolak saat start.
- `CORS_ORIGINS` — origin persis, tanpa slash di akhir. Sertakan URL produksi Vercel dan domain custom kalau ada.

```env
CORS_ORIGINS=https://quotahub.vercel.app,https://app.example.com
```

`ALLOW_SIGNUP` di file ini boleh `true` untuk laptop. Compose produksi menimpanya menjadi `false`.

Generate:

```bash
python -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Domain dan akun Mongo

```bash
cp .env.example .env
```

Edit `.env` di root server:

- `API_DOMAIN` — hostname API, misalnya `api.example.com`. Tanpa `https://`.
- `MONGO_ROOT_USERNAME`
- `MONGO_ROOT_PASSWORD` — huruf dan angka saja, panjang. Karakter `@`, `:`, `/`, `#`, `?`, dan `$` merusak connection string.

Akun root Mongo hanya dibuat saat volume data masih kosong. Jangan memakai volume lama yang sebelumnya jalan tanpa autentikasi.

## 4. Jalankan stack produksi

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

Yang berjalan: `quotahub-mongo` (tanpa port host), `quotahub-backend` (tanpa port host, uvicorn tanpa `--reload`), dan `quotahub-caddy` pada port 80 dan 443.

`/docs`, `/redoc`, dan `/openapi.json` mati karena `ENVIRONMENT=production`.

## 5. Deploy frontend ke Vercel

1. Import repositori Git. Framework: Next.js. Root directory: root repo (bukan `backend/`).
2. Sebelum build pertama, set environment variable:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

Nilai `NEXT_PUBLIC_*` ditanam saat build. Mengubahnya di Vercel mengharuskan deploy ulang.

3. Deploy. Kalau memakai domain custom, tambahkan origin itu ke `CORS_ORIGINS`, lalu restart backend:

```bash
docker compose -f docker-compose.prod.yml up -d
```

## 6. Verifikasi

```bash
curl -fsS https://api.example.com/health
```

Respons yang sehat:

```json
{"status":"healthy","app":"QuotaHub API","version":"2.0.0"}
```

`/health` juga men-ping Mongo. Kalau database mati, responsnya `503`.

Cek lain:

- `https://api.example.com/docs` harus `404`.
- Dari browser, login di URL Vercel memakai akun `DEFAULT_USERNAME`. Tab daftar tidak muncul (`ALLOW_SIGNUP=false`).
- Login dibatasi 10 percobaan per menit per IP dan per username.

Pantau `https://api.example.com/health` dengan uptime monitor. Alert pada status selain `200`.

## 7. Backup

Backup lokal tidak menulis ke volume database:

```bash
sh scripts/backup-mongo.sh
sh scripts/restore-mongo.sh ./backups/quotahub-YYYYMMDD
```

Salin keluar server dengan cron. Contoh tiap hari pukul 03:00, setelah `coscli` terpasang dan terkonfigurasi:

```cron
0 3 * * * cd /opt/quotahub && BACKUP_DIR=/var/backups/quotahub COS_BUCKET=nama-bucket sh scripts/backup-mongo.sh >> /var/log/quotahub-backup.log 2>&1
```

## 8. Update

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

Volume `mongo_data` tidak ikut terhapus. `docker compose down -v` menghapus database.

## 9. Log

API key tidak ditulis ke log. Kegagalan cek provider hanya mencatat nama tipe exception, bukan URL atau isi error (URL 2Captcha memuat key). Connection string Mongo juga tidak dicatat.
