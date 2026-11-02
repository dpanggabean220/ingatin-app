# INGATIN v2.0 — Obsidian Pro Edition 🗿🔥

> **Aplikasi Pengingat Dokumen Penting & Perintah Suara Harian Berbasis Privasi (100% Offline-First & Zero-PII)** untuk iOS & Android.

Dibangun dengan **React Native (Expo SDK 54)**, **TypeScript**, **Expo Router**, dan **Supabase (Optional Cloud Backup + RLS)** menggunakan sistem desain **Obsidian Dark & Burnt Orange Glow (`#F25C05`)**.

---

## ✨ Keunggulan Utama (Key Highlights)

### 1. 🛡️ 100% Offline-First & Privasi Zero-PII
- **Berjalan Tanpa Internet:** Seluruh operasi tambah, ubah, perpanjang, dan hapus dokumen berjalan instan di penyimpanan lokal (`AsyncStorage` via [`offlineStore.ts`](src/utils/offlineStore.ts)). Supabase hanya bertindak sebagai *cloud backup* opsional di latar belakang.
- **Brankas Foto Dokumen Lokal Berproteksi Face ID:** Foto fisik SIM, STNK, KTP, atau Paspor disimpan **100% di memori internal perangkat** ([`localDocumentPhoto.ts`](src/utils/localDocumentPhoto.ts)) dan tidak pernah diunggah ke server mana pun. Pratinjau foto otomatis disamarkan (*blurred*) dan memerlukan verifikasi **Face ID / Biometrik** ([`biometricLock.ts`](src/utils/biometricLock.ts)) untuk dilihat.
- **Sensor Nomor Dokumen:** Nomor plat/registrasi disensor otomatis (`B 34•• ••`) di kartu daftar hingga pengguna membuka kunci dengan Face ID.

### 2. 🎙️ Pusat Perintah Suara & NLP Bahasa Indonesia
- **Parser Bahasa Alami Indonesia ([`commandParser.ts`](src/utils/commandParser.ts)):** Mengubah kalimat sehari-hari seperti *"Ingatin gua jam 1 makan siang"* atau *"Besok jam 9 pagi bayar pajak motor"* menjadi alarm terjadwal secara instan.
- **Notifikasi Interaktif Lockscreen:** Mendukung tombol aksi langsung **"✓ Selesai"** (`MARK_DONE`) dan **"⏰ Tunda 10 Menit"** (`SNOOZE_10M`) langsung dari banner notifikasi iOS/Android ([`quickReminders.ts`](src/features/quick-reminders/quickReminders.ts)).

### 3. 📅 Kalender Jatuh Tempo Visual & Sinkronisasi Apple/Android Calendar
- **Kalender Bulanan Interaktif ([`document-calendar-view.tsx`](src/components/document-calendar-view.tsx)):** Menampilkan tanggal jatuh tempo dengan indikator lingkaran **Burnt Orange (`#F25C05`)** beserta daftar timeline **"Ongoing"** di bawahnya.
- **One-Tap Native Calendar Sync ([`calendarSync.ts`](src/utils/calendarSync.ts)):** Menambahkan jadwal jatuh tempo dokumen langsung ke aplikasi Kalender bawaan iPhone/Android lengkap dengan alarm H-7 dan H-1.

### 4. 💳 Pelacak Anggaran Perpanjangan & Manajemen Dokumen Keluarga
- **Estimasi Biaya 30 Hari Ke Depan ([`renewalBudget.ts`](src/utils/renewalBudget.ts)):** Menghitung otomatis total dana perpanjangan yang perlu disiapkan dalam 30 hari mendatang.
- **Multi-Pemilik Dokumen ([`documentOwner.ts`](src/utils/documentOwner.ts)):** Kelompokkan dokumen milik **Pribadi**, **Pasangan**, **Orang Tua**, **Anak**, atau **Kantor** dengan filter cepat.
- **Panduan & Checklist Perpanjangan Resmi ([`panduanPerpanjangan.ts`](src/constants/panduanPerpanjangan.ts)):** Menampilkan syarat berkas resmi dan aplikasi layanan (*Digital Korlantas SINAR*, *SIGNAL Samsat Digital*, *M-Paspor*) untuk setiap kategori dokumen.

---

## 🏗️ Arsitektur & Struktur Direktori

```text
ingatin/
├── assets/images/                 # Aset visual (mascot-statue.png, ikon aplikasi)
├── src/
│   ├── app/                       # File-based routing (Expo Router)
│   │   ├── (tabs)/
│   │   │   ├── index.tsx          # Beranda (Hero Card, Pusat Perintah Suara, 2 Dokumen Terdekat)
│   │   │   ├── dokumen.tsx        # Daftar Semua Dokumen & Kalender Visual Bulanan
│   │   │   └── pengaturan.tsx     # Pengaturan Profil, Biometrik, Backup JSON, & Widget
│   │   ├── dokumen/[id].tsx       # Detail Dokumen, Lifecycle Bar, Panduan Resmi, & Foto Lokal
│   │   ├── tambah.tsx             # Modal Tambah Dokumen Baru
│   │   └── _layout.tsx            # Root Layout, Onboarding Overlay, & Face ID App Lock
│   ├── components/                # Komponen UI Modular (Anti-AI Slop Custom SVG System)
│   │   ├── onboarding-overlay.tsx # Layar Sambutan "Get Started"
│   │   ├── document-calendar-view.tsx # Kalender Bulanan & Ongoing Timeline
│   │   ├── document-card.tsx      # Kartu Dokumen dengan Sensor Privasi & Badge Pemilik
│   │   ├── smart-command-bar.tsx  # Input Perintah Suara & Live NLP Preview
│   │   └── vector-icon.tsx        # Sistem Ikon Vektor SVG Tajam
│   ├── constants/                 # Palet Warna Obsidian Dark, Kategori, & Panduan Resmi
│   ├── features/                  # Logika Bisnis (Auth, Items CRUD, Quick Reminders)
│   ├── utils/                     # Utilitas Offline Store, Biometrik, Budget, & Backup JSON
│   └── widgets/                   # Komponen Homescreen Widget (iOS & Android)
└── eas.json                       # Konfigurasi EAS Build (Development, Preview APK, Production)
```

---

## 🚀 Cara Menjalankan Proyek

### 1. Prasyarat & Instalasi
```bash
cd ingatin
npm install
```

### 2. Menjalankan di HP Fisik (via Expo Go)
```bash
npx expo start --go
```
- **iPhone:** Buka aplikasi **Expo Go** (atau Kamera/Safari) dan masukkan URL server lokal yang tampil di terminal.
- **Android:** Scan QR Code langsung menggunakan aplikasi **Expo Go**.

### 3. Membangun File `.APK` / Standalone Build (via EAS Build)
```bash
# Login ke akun Expo
npx eas-cli login

# Build file .APK mandiri untuk Android
npx eas-cli build --platform android --profile preview

# Build Development Client untuk iOS / Android
npx eas-cli build --platform ios --profile development
```

### 4. Pemeriksaan Tipe Statis (TypeScript)
```bash
npx tsc --noEmit
```

---

## 🔒 Prinsip Keamanan & Privasi
1. **Local-First Storage:** Data tetap tersedia penuh meskipun perangkat tidak pernah terhubung ke internet.
2. **Zero-PII Cloud Policy:** Foto dokumen fisik disimpan eksklusif di direktori sandbox perangkat lokal (`FileSystem.documentDirectory`) dan tidak pernah dikirim ke cloud.
3. **Portable Open JSON Backup:** Pengguna memiliki kendali penuh untuk mengekspor dan memulihkan seluruh datanya dalam format file `.json` mandiri kapan saja.
