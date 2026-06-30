<p align="center">
  <img src="/banner.jpg" alt="FinSpace" width="100%" style="border-radius: 16px;" />
</p>

<p align="center">
  <strong>Personal Finance Manager</strong> — Aplikasi manajemen keuangan pribadi offline-first dengan AI chatbot, scanning struk, dan Web Bluetooth untuk cetak struk thermal.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06b6d4?logo=tailwindcss" alt="Tailwind v4" />
  <img src="https://img.shields.io/badge/PWA-✓-purple" alt="PWA" />
  <img src="https://img.shields.io/badge/IndexedDB-Dexie.js-039be5" alt="Dexie.js" />
</p>

---

## Fitur

| Modul | Deskripsi |
|-------|-----------|
| **📊 Dasbor** | Ikhtisar keuangan real-time, ringkasan kekayaan bersih, grafik pemasukan/pengeluaran, saldo per kantong |
| **💰 Anggaran** | Aturan 50/30/20, sistem kantong (Tunai/E-Wallet/Rekening), filter transaksi per kantong, transfer antar kantong |
| **📈 Kekayaan** | Lacak kekayaan bersih, aset (kas, emas, reksa dana, saham), liabilitas (utang, cicilan, kartu kredit), rasio kesehatan keuangan |
| **🛠️ Alat** | Kalkulator finansial, perencana, dan utilitas keuangan |
| **🤖 AI Asisten** | Chatbot finansial + scan struk otomatis dengan Hybrid AI (bluetooth thermal printing) |

## Tech Stack

| Layer | Pilihan |
|-------|---------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Styling** | Tailwind CSS v4 (`@theme` directive) |
| **Database Lokal** | Dexie.js (IndexedDB wrapper) |
| **State UI** | React hooks + `useLiveQuery` (Dexie React) |
| **Ikon** | Lucide React |
| **Chart** | Recharts |
| **PWA** | Serwist (Service Worker) |
| **Hosting** | Vercel |

## Arsitektur

**Offline-First** — Semua operasi baca/tulis diarahkan ke IndexedDB lokal terlebih dahulu. Service Worker menangani background sync dan caching aset statis.

**Sistem Kantong** — 6 preset kantong (Tunai, Dana, Gopay, BCA, Seabank, Bank Jago) dengan saldo dihitung dari total pemasukan dikurangi pengeluaran per kantong. Transaksi tanpa kantong fallback ke Tunai.

**Kekayaan Bersih** — Dihitung di client-side: `Total Aset − Total Liabilitas`. Termasuk rasio likuiditas, rasio tabungan, dan debt-to-income ratio.

## Memulai

```bash
# Clone
git clone https://github.com/codenamezaxx/FinSpace.git
cd FinSpace

# Install dependencies
npm install

# Development server
npm run dev

# Build production
npm run build

# Jalankan di localhost
npm start
```

Buka [http://localhost:3000](http://localhost:3000).

### Testing

```bash
npm test          # Vitest (unit test)
npm run test:watch  # Watch mode
npm run lint        # ESLint
```

## Struktur Proyek

```
src/
├── app/              # Next.js App Router pages
│   ├── budget/       # Halaman anggaran
│   ├── dashboard/    # Halaman dasbor
│   ├── wealth/       # Halaman kekayaan
│   └── tools/        # Halaman alat
├── components/
│   ├── budget/       # Komponen anggaran & kantong
│   ├── dashboard/    # Komponen dasbor
│   ├── wealth/       # Komponen kekayaan
│   ├── ai/           # Komponen AI (chatbot, scan)
│   ├── layout/       # Navigasi, layout shell
│   └── shared/       # Komponen bersama
├── hooks/            # Custom React hooks
├── lib/              # Utilities, constants, database
└── styles/           # Global styles
```

## Skrip Tersedia

| Perintah | Kegunaan |
|----------|----------|
| `npm run dev` | Development server (localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Jalankan production build |
| `npm run lint` | ESLint check |
| `npm test` | Unit test (Vitest) |

## Lisensi

Proyek ini bersifat privat — tidak ada lisensi publik.
