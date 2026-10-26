# 🛰️ QuotaHub — API Key & Quota Monitoring Dashboard

> **Fullstack Architecture**: Next.js 16 (App Router) + Tailwind CSS v4 + FastAPI (Python) + MongoDB + AES-256-GCM Authenticated Encryption.

QuotaHub adalah platform pemantau kuota dan saldo API key terpusat untuk berbagai layanan AI dan automasi (**TikHub**, **OpenAI**, **2Captcha**, **Anthropic**, **Gemini**, **Groq**, **DeepSeek**, dan **Custom Endpoint**). 

Platform ini mengadopsi struktur **Multi-Project Workspace** di mana pengguna mengelompokkan API key ke dalam project tertentu dengan jaminan privasi dan enkripsi *at-rest* tingkat tinggi.

---

## 📑 Daftar Isi
1. [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
2. [Kredensial Akses Awal](#-kredensial-akses-awal)
3. [Panduan Menjalankan: Local Development](#-panduan-menjalankan-local-development)
4. [Panduan Menjalankan: Docker Deployment](#-panduan-menjalankan-docker-deployment)
5. [Alur Update & Pemeliharaan (Maintenance)](#-alur-update--pemeliharaan-maintenance)
6. [Backup & Restore Database MongoDB](#-backup--restore-database-mongodb)
7. [Panduan Keamanan & Kunci Enkripsi](#-panduan-keamanan--kunci-enkripsi)

---

## 🏗️ Arsitektur & Tech Stack

```text
QuotaHub/
├── src/                     # Frontend Next.js 16 (App Router, Tailwind CSS v4, Lucide Icons)
├── backend/                 # Backend FastAPI (Python 3.12, Motor Async MongoDB, AESGCM Crypto)
│   ├── app/
│   │   ├── core/           # Config, AES-256-GCM crypto engine, MongoDB connection
│   │   ├── models/         # Pydantic v2 schemas & MongoDB documents
│   │   ├── routers/        # /auth, /projects, /keys endpoints
│   │   └── services/       # Outbound async checkers (TikHub, 2Captcha, OpenAI)
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml       # Lokal: Mongo + FastAPI + Next.js
├── docker-compose.prod.yml  # Server: Mongo + FastAPI + Caddy (HTTPS)
├── Dockerfile               # Kontainer Next.js Production
├── DEPLOY.md                # Deploy Vercel + server (Tencent)
└── README.md
```

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS v4, Lucide React, Dual Language (🇮🇩 Indonesia [Default] / 🇬🇧 English).
- **Backend API**: FastAPI, Uvicorn, Motor (Async MongoDB Driver), Pydantic v2, HTTPX.
- **Database**: MongoDB 7.0 (Persistent volume).
- **Keamanan**: AES-256-GCM authenticated encryption dengan 12-byte nonce unik per API key.

---

## 🔑 Kredensial Akses

Salin `backend/.env.example` menjadi `backend/.env`, lalu isi nilai Anda sendiri. Jangan commit file `.env`.

1. **Sign In (Masuk)**: gunakan `DEFAULT_USERNAME` dan `DEFAULT_PASSWORD` dari `.env`. Proses backend menolak password kosong atau placeholder (`changeme`, `password`, `admin`, dan sejenisnya).
2. **Sign Up (Daftar Akun Baru)**: pendaftaran akun baru yang tersimpan di database. Matikan di server publik dengan `ALLOW_SIGNUP=false`.
3. **Guest Mode (Mode Tamu)**: akses 1-klik untuk menjelajahi dashboard dalam sandbox lokal. Mode ini tidak memakai API.

---

## 💻 Panduan Menjalankan: Local Development

### Prasyarat
- **Node.js** >= 20.x
- **Python** >= 3.10
- **MongoDB** berjalan di port `27017` (bisa via MongoDB Compass, service lokal, atau container docker)

### 1. Jalankan MongoDB Lokal
Jika menggunakan Docker untuk MongoDB saja:
```bash
docker run -d --name quotahub-mongo -p 127.0.0.1:27017:27017 -v mongo_data:/data/db mongo:7.0
```

### 2. Jalankan Backend (FastAPI)
Buka terminal baru di folder `backend/`:
```bash
cd backend

# Buat virtual environment (opsional namun disarankan)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependensi
pip install -r requirements.txt

# Jalankan server FastAPI
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **API URL**: `http://localhost:8000`
- **Swagger Interactive API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

### 3. Jalankan Frontend (Next.js)
Buka terminal baru di root folder:
```bash
# Install dependensi frontend (jika belum)
npm install

# Jalankan dev server
npm run dev
```
- **Web Dashboard**: `http://localhost:3000`

---

## 🐳 Panduan Menjalankan: Docker Deployment

Docker Compose adalah cara tercepat untuk menjalankan seluruh ekosistem QuotaHub (MongoDB, FastAPI, dan Next.js) dalam 1 perintah di mesin lokal. Deploy ke server (Vercel + HTTPS) ada di [DEPLOY.md](DEPLOY.md).

### 1. Menjalankan Semua Layanan
Di root direktori proyek, jalankan:
```bash
docker compose up -d --build
```

Perintah di atas akan otomatis:
1. Menjalankan kontainer **MongoDB 7.0** dan membuat volume persistent `mongo_data`.
2. Membangun dan menjalankan kontainer **FastAPI Backend** di port `8000`.
3. Membangun dan menjalankan kontainer **Next.js Frontend** di port `3000`.

### 2. Memeriksa Status Kontainer
```bash
docker compose ps
```
Output yang sehat:
```text
NAME                 IMAGE               STATUS         PORTS
quotahub-mongo       mongo:7.0           Up (healthy)   127.0.0.1:27017->27017/tcp
quotahub-backend     quotahub-backend    Up             0.0.0.0:8000->8000/tcp
quotahub-frontend    quotahub-frontend   Up             0.0.0.0:3000->3000/tcp
```
Port Mongo hanya terikat ke `127.0.0.1`, jadi tidak terbuka ke internet. Autentikasi Mongo dan HTTPS dipakai di deploy server, lihat [DEPLOY.md](DEPLOY.md).

### 3. Memantau Log
```bash
# Pantau log backend FastAPI
docker compose logs -f backend

# Pantau seluruh log
docker compose logs -f
```

### 4. Menghentikan Layanan
```bash
# Berhenti tanpa menghapus data
docker compose stop

# Hentikan dan hapus container (data volume MongoDB tetap aman tersimpan)
docker compose down
```

---

## 🔄 Alur Update & Pemeliharaan (Maintenance)

Ketika ada pembaruan kode di repositori:

### Update Tanpa Menghapus Data Database:
```bash
# 1. Ambil kode terbaru dari git
git pull origin main

# 2. Rebuild dan restart kontainer yang diperbarui (misal: backend)
docker compose up -d --build backend

# Atau rebuild semua container sekaligus
docker compose up -d --build
```
> Volume database `mongo_data` berada di luar container, sehingga seluruh API key, project, dan akun user **tidak akan hilang** saat container di-rebuild.

---

## 💾 Backup & Restore Database MongoDB

Dump ditulis ke `/tmp` di dalam container, lalu disalin ke `./backups/quotahub-YYYYMMDD` di host. Folder itu berisi subfolder `quotahub/`. Dump tidak disimpan di volume data Mongo.

### 1. Backup Database (Dump)
Dari root repositori, dengan container `quotahub-mongo` sedang berjalan:
```bash
sh scripts/backup-mongo.sh
```
Hasilnya: `./backups/quotahub-YYYYMMDD/quotahub/`.

Untuk menyalin keluar server (Tencent COS), pasang [coscli](https://www.tencentcloud.com/document/product/436/43263), lalu:
```bash
COS_BUCKET=nama-bucket sh scripts/backup-mongo.sh
```

### 2. Restore Database
Gunakan folder yang sama dengan hasil backup:
```bash
sh scripts/restore-mongo.sh ./backups/quotahub-YYYYMMDD
```

---

## 🛡️ Panduan Keamanan & Kunci Enkripsi

### Cara Generate Master Encryption Key
Generate kunci acak 256-bit (32 bytes) dan simpan hanya di `backend/.env`:
```bash
python -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"
```
```env
APP_MASTER_ENCRYPTION_KEY=hasil_generate
JWT_SECRET=string_acak_panjang
```
Kehilangan `APP_MASTER_ENCRYPTION_KEY` membuat seluruh API key yang sudah tersimpan tidak bisa didekripsi. Simpan salinannya di password manager, terpisah dari disk server. Jangan menaruh kunci ini di Git, README, log, atau `docker-compose.yml`.

### Mengapa Kunci API Aman di MongoDB?
1. **Tidak Ada Plaintext di Database**: MongoDB hanya menyimpan string *Base64 ciphertext* dan *nonce*.
2. **Integritas Terverifikasi (Authenticated Encryption)**: Jika isi ciphertext di database dimodifikasi secara ilegal oleh pihak luar, proses dekripsi otomatis melempar `InvalidTag Exception` dan menolak menggunakan key tersebut.
3. **RAM Ephemeral**: Plaintext key hanya berada di RAM server Python selama durasi panggilan HTTP ke TikHub/OpenAI/2Captcha, setelah itu langsung dibersihkan.
