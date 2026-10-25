# Kuesioner & FAQ Checklist Perencanaan Website

Daftar pertanyaan panduan yang digunakan untuk mengidentifikasi kebutuhan pembuatan website sebelum tahap pengkodean:

## 1. Konteks & Tujuan Bisnis
- [ ] Apa nama website/brand/produk? (e.g. QuotaHub)
- [ ] Apa tujuan utama website? (Dashboard pemantauan kuota API, estimasi pengeluaran, peringatan saldo habis)
- [ ] Apa tindakan utama (Call to Action / CTA)? (Tambah API Key, Cek Saldo Real-time, Top-up Direct Link)

## 2. Audiens & Desain Visual
- [ ] Siapa target audiens yang dituju? (Developer, AI Engineer, Scraping Specialist, Automation Builder)
- [ ] Bagaimana preferensi gaya visual? (Sleek Dark Mode, Cyber/Fintech dashboard, Glassmorphism, Neon status indicators)
- [ ] Apakah ada referensi website yang disukai? (Linear, Vercel, Supabase, Cloudflare dashboard)

## 3. Struktur Halaman & Fitur
- [ ] Apa saja halaman / view utama?
  - [ ] Overview Dashboard (Summary Total Kuota, Saldo Sisa, Provider Aktif)
  - [ ] Provider Details (OpenAI, TikHub, 2Captcha, Anthropic, Gemini, DeepSeek, Groq)
  - [ ] API Key Manager (Add, Mask/Unmask, Delete, Label, Custom Endpoint)
  - [ ] Logs & Usage Analytics (Chart pemakaian, riwayat pengecekan)
  - [ ] Settings & Alerts (Threshold peringatan kuota < 10%, Export/Import config)

## 4. Keamanan & Teknis
- [ ] Penyimpanan key: 100% Client-Side LocalStorage (Privasi terjaga, API key tidak pernah dikirim ke server luar)
- [ ] Stack: Semantic HTML5 + Vanilla CSS + Modular Vanilla JS
