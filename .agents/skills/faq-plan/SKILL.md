---
name: faq-plan
description: >-
  Use this skill when the user types "/faq_plan", asks to plan a website development project,
  or requests an FAQ-driven website blueprint, information architecture, and implementation roadmap.
---

# Website Planning & FAQ Blueprint Skill (`/faq_plan`)

Skill ini memandu agen untuk merancang perencanaan pembuatan website secara holistik, terstruktur, dan siap eksekusi sebelum baris kode pertama ditulis.

---

## Alur Kerja Eksekusi (Workflow Steps)

Ketika dipicu oleh perintah `/faq_plan` atau permintaan perencanaan website:

### 1. Tahap Discovery & Kuesioner Kunci (FAQ Gathering)
Evaluasi informasi yang sudah diberikan pengguna. Jika ada aspek fundamental yang belum jelas, tanyakan atau konfirmasikan poin-poin berikut:
- **Tujuan Utama & Konversi**: Portofolio, landing page SaaS, tools/dashboard, company profile, atau web app?
- **Target Audiens & Tone**: Developer, bisnis B2B, kasual, modern/cyber/fintech?
- **Daftar Halaman & Konten Utama**: Modul dashboard, kartu saldo/kuota, manajemen API key, riwayat pemakaian, notifikasi batas kuota.
- **Teknologi & Styling**: HTML/Vanilla CSS (sesuai standar), Vanilla JS (reactive components, localStorage, modern UI).
- **Fitur Khusus**: Keamanan (enkripsi client-side/local storage), visualisasi chart kuota, live refresh, sound/alert bila kuota menipis.

### 2. Information Architecture & Sitemap
Susun peta navigasi dan hierarki halaman/komponen menggunakan diagram Mermaid.

### 3. Design System & Technical Specifications
Tentukan standar teknis dan estetika visual:
- **Color Palette**: Dark background slate/obsidian, aksen neon cyan/emerald/violet, alert amber/rose.
- **Typography**: Google Fonts ("Plus Jakarta Sans", "Inter", "JetBrains Mono").
- **Struktur Folder Proyek**:
  ```text
  ├── index.html
  ├── css/
  │   ├── index.css          # Design tokens, variables & reset
  │   ├── components.css     # Card, table, modal, badge, progress bar
  │   └── dashboard.css      # Layout grid & dashboard modules
  ├── js/
  │   ├── app.js             # Entrypoint & routing/view toggle
  │   ├── providers.js       # Konfigurasi provider (OpenAI, TikHub, 2Captcha, dll)
  │   ├── storage.js         # Local storage & security
  │   └── ui.js              # Render DOM & interaktivitas
  └── assets/
  ```

### 4. Implementation Roadmap (Phased Plan)
Bagi eksekusi menjadi fase-fase terstruktur dan dapat dieksekusi.

### 5. Output Deliverable
Sajikan hasil perencanaan dalam bentuk Artifact markdown komprehensif.
