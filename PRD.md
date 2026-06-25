# PRODUCT REQUIREMENT DOCUMENT (PRD) — FinSpace

**Versi Dokumen:** 1.0  
**Tanggal:** Juni 2026  
**Status:** Ready for Execution

---

## 1. Ringkasan Eksekutif & Visi Produk

FinSpace adalah aplikasi manajemen keuangan pribadi (*Financial Health Hub*) yang mengutamakan pendekatan **Mobile-First** dan arsitektur **Offline-First**. Produk ini dirancang khusus untuk memberikan keandalan pencatatan kapan saja dan di mana saja tanpa ketergantungan konstan pada internet. Dengan memotong friksi pengisian data manual menggunakan teknologi **Hybrid AI (Scan Struk & Chatbot)**, FinSpace membantu individu mengelola siklus keuangan mereka secara menyeluruh dari satu tempat.

## 2. Arsitektur Utama & Panduan Teknis (PWA)

* **Paradigma Arsitektur:** Progressive Web App (PWA) dengan pendekatan *Local-First*. Semua operasi tulis/baca utama harus diarahkan ke database lokal terlebih dahulu.
* **Tech Stack Inti:** Next.js (React Framework), Tailwind CSS, RxDB atau Dexie.js (Wrapper IndexedDB), Serwist/Next-PWA (Service Worker Engine), dan Vercel (Hosting Platform).
* **Strategi Sinkronisasi Data (Hybrid AI & Data Sync):**
  * Aplikasi wajib mendeteksi status jaringan menggunakan `navigator.onLine`.
  * **Mode Offline:** Semua input gambar struk dimasukkan ke dalam IndexedDB sebagai `Blob` antrean. Input teks chat AI disimpan ke dalam *local queue array*.
  * **Mode Online:** Service Worker mendengarkan *event sync*, secara otomatis mengunggah antrean gambar/teks ke AI API secara asinkron di latar belakang (*background sync*), lalu memperbarui status transaksi lokal setelah berhasil diparsing.

---

## 3. Spesifikasi Fungsional (Modul Berbasis Antarmuka Terpisah)

Setiap modul di bawah ini wajib diimplementasikan dengan antarmuka, tata letak, dan *routing* halaman yang terpisah secara tegas (*Separated Interfaces*) untuk mengoptimalkan pengalaman pengguna di perangkat seluler.

### Modul A: Anggaran & Arus Kas (Budgeting & Cashflow)
* **Deskripsi:** Manajemen pencatatan pengeluaran harian dan kuota batas anggaran.
* **Metode Keuangan:** Menerapkan sistem *Zero-Based Budgeting* atau aturan alokasi **50/30/20** (Kebutuhan, Keinginan, Tabungan).
* **Fitur Cetak Struk (Receipt Generator):**
  * Pengguna dapat menekan tombol "Cetak Struk" pada detail transaksi.
  * Sistem memanfaatkan *Web Bluetooth API* untuk mendeteksi dan mengirimkan teks berformat raw/ESC-POS langsung ke printer thermal *bluetooth* nirkabel lokal, atau merendernya ke bentuk file PDF siap unduh.

### Modul B: Kekayaan Bersih (Net Worth Tracker)
* **Deskripsi:** Mengukur total aset yang dimiliki dikurangi total liabilitas/utang saat ini.
* **Kalkulasi Matematika (Formulasi):**
  Sistem wajib mengeksekusi perhitungan kekayaan bersih secara berkala di sisi klien (*client-side*) dengan rumus:

  $$\text{Kekayaan Bersih (Net Worth)} = \sum \text{Aset} - \sum \text{Liabilitas}$$

  * *Keterangan Aset:* Kas, Saldo Rekening Bank, Logam Mulia (Emas), Reksa Dana, Saham.
  * *Keterangan Liabilitas:* Sisa cicilan, utang kartu kredit, utang personal.

### Modul C: Rasio Kesehatan Keuangan (Financial Health Calculator)
* **Deskripsi:** Modul analitik otomatis untuk memantau status kondisi finansial pengguna.
* **Formulasi Matematika Rasio:**
  Sistem menggunakan data dari Modul A dan Modul B untuk menghitung tiga rasio esensial secara instan:

  1. **Rasio Likuiditas (Emergency Buffer):**
     $$\text{Rasio Likuiditas} = \frac{\text{Aset Likuid}}{\text{Pengeluaran Bulanan}}$$
     *Kriteria Status:* Aman jika hasil $\ge 3$ hingga $6$ bulan.

  2. **Rasio Tabungan (Savings Rate):**
     $$\text{Rasio Tabungan} = \left( \frac{\text{Total Tabungan Bulanan}}{\text{Pendapatan Bulanan}} \right) \times 100\%$$
     *Kriteria Status:* Sehat jika hasil $\ge 20\%$.

  3. **Rasio Utang (Debt-to-Income):**
     $$\text{Rasio Utang} = \left( \frac{\text{Total Cicilan Utang}}{\text{Pendapatan Bulanan}} \right) \times 100\%$$
     *Kriteria Status:* Aman jika hasil $< 30\%$.

### Modul D: Edukasi Kontekstual (Smart Insights)
* **Deskripsi:** Menampilkan tips keuangan pendek di halaman utama berdasarkan hasil skor dari Modul C.
* **Sifat Fitur:** 100% bekerja secara *offline*. Data tips disimpan dalam file JSON statis lokal di dalam repositori proyek.
* *Contoh Trigger Logika:* Jika Rasio Utang $> 30\%$, tampilkan tips taktik pelunasan utang (Metode *Debt Snowball*).

### Modul E: Asisten AI (Scan Struk & Chatbot Finny)
* **Fitur Scan Struk:** Mengambil gambar via kamera, melakukan ekstraksi data teks (OCR) berbasis AI saat online untuk menghasilkan skema data transaksi otomatis.
* **Fitur Chatbot "Finny":** Antarmuka percakapan natural untuk memasukkan data transaksi.
* **Spesifikasi Skema Output AI (JSON target parsing):**

  ```json
  {
    "transaction_type": "expense",
    "amount": 35000,
    "merchant": "Bakso Pak Joko",
    "category": "Makanan & Minuman",
    "payment_method": "Cash",
    "confidence_score": 0.95
  }
  ```

---

## 4. Panduan Sistem Desain UI/UX (Mobile-First)

Desain antarmuka FinSpace wajib merujuk secara ketat pada visualisasi palet warna yang bersumber dari berkas **Color Hunt Palette 333d6d723ec3ffcf95fff0d9.png**.

### Panduan Distribusi Palet Warna

* **`#FFF0D9` (Cream Ringan):** Latar belakang (*background*) utama seluruh halaman aplikasi untuk kenyamanan mata pengguna seluler.
* **`#333D6D` (Navy Tua):** Teks judul utama (*headings*), teks navigasi aktif, dan komponen kartu (*card container*) finansial utama.
* **`#723EC3` (Ungu Modern):** Aksen identitas *brand*, tombol aksi utama (Call to Action / CTA) seperti "Tambah Transaksi", dan ikon navigasi aktif.
* **`#FFCF95` (Peach Soft):** Garis pembatas (*borders*), latar belakang komponen *badge/tagging* kategori, serta warna penanda kondisi waspada/peringatan.

### Tata Letak Navigasi (Layouting)

* **Mobile:** Gunakan **Bottom Navigation Bar** dengan tinggi tetap yang ramah jangkauan ibu jari pengguna. Tombol melayang (*Floating Action Button*) diletakkan di bagian kanan bawah dengan warna dasar Ungu (`#723EC3`) untuk memicu AI Assistant.
* **Desktop (≥1024px):** Bottom Navigation Bar bertransisi menjadi **Sidebar** persisten di sisi kiri. Konten utama dibatasi lebar maksimal `1280px` dan diratakan tengah.
* **Responsivitas:** Setiap halaman harus terlihat proporsional di semua ukuran layar — tabel dan grafik menggunakan ruang horizontal yang tersedia di desktop, dan bertumpuk secara vertikal di mobile.

---

## 5. Cetak Biru Skema Data Lokal (IndexedDB / RxDB)

### Tabel 1: `transactions`
```json
{
  "title": "transactions schema",
  "version": 0,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "amount": { "type": "number" },
    "type": { "type": "string", "enum": ["income", "expense"] },
    "category": { "type": "string" },
    "merchant": { "type": "string" },
    "payment_method": { "type": "string" },
    "timestamp": { "type": "number" },
    "sync_status": { "type": "string", "enum": ["synced", "pending", "local_only"] }
  },
  "required": ["id", "amount", "type", "category", "timestamp", "sync_status"]
}
```

### Tabel 2: `ai_queue`
```json
{
  "title": "ai processing queue schema",
  "version": 0,
  "primaryKey": "queue_id",
  "type": "object",
  "properties": {
    "queue_id": { "type": "string" },
    "input_type": { "type": "string", "enum": ["text_chat", "image_blob"] },
    "payload": { "type": "string" },
    "created_at": { "type": "number" }
  },
  "required": ["queue_id", "input_type", "payload", "created_at"]
}
```

---

## 6. Kriteria Penerimaan (Acceptance Criteria) & Validasi AI

* **Validasi Mode Pesawat (100% Offline):** Aplikasi harus tetap dapat dimuat ulang (reload) dari kondisi browser tertutup saat perangkat berada dalam mode pesawat. Seluruh formulir pencatatan manual wajib berfungsi normal dan menyimpan data ke database lokal tanpa memunculkan pesan galat jaringan server.
* **Validasi Akurasi Rasio Keuangan:** Jika input total aset likuid bernilai Rp12.000.000 dan pengeluaran bulanan bernilai Rp3.000.000, maka modul Rasio Keuangan di Dashboard harus secara instan merender visualisasi angka 4.0 pada aspek Rasio Likuiditas, serta memicu teks rekomendasi dari berkas JSON lokal.
* **Validasi Konsistensi Warna Kontras:** Setiap tombol utama dengan latar belakang Ungu (#723EC3) harus membungkus komponen teks berwarna Putih (#FFFFFF) atau Cream (#FFF0D9) demi menjaga nilai kontras rasio aksesibilitas minimal sebesar 4.5:1.
* **Validasi Responsivitas Desktop:** Aplikasi harus tetap dapat digunakan secara ergonomis pada layar selebar 1920px tanpa merusak tata letak atau membuat konten terlalu melebar.

---

## 7. Persyaratan Keamanan (Security Requirements)

* **Validasi Input:** Semua input pengguna (jumlah, nama merchant, kategori) harus divalidasi dan disanitasi sebelum ditulis ke IndexedDB. Dilarang menyimpan HTML mentah — perlakukan semua data sebagai teks.
* **CSP (Content Security Policy):** Konfigurasikan header CSP di `next.config.ts` atau `vercel.json` untuk membatasi sumber script yang diizinkan.
* **Data Sensitif:** Data finansial sensitif (nomor rekening, password, ID pribadi) tidak boleh disimpan mentah di IndexedDB. Gunakan `crypto.subtle` untuk mengenkripsi field PII saat *at rest*.
* **Web Bluetooth:** Permintaan koneksi Bluetooth hanya boleh dilakukan saat pengguna menekan tombol secara eksplisit. Dilarang melakukan pemindaian otomatis.
* **Dependensi:** Jalankan `npm audit` secara berkala. Kunci versi dependensi runtime melalui lockfile.

---

## 8. Persyaratan Testing (Testing Requirements)

* **Unit Tests:** Logika murni — formula keuangan, perhitungan Net Worth, komputasi rasio. Gunakan Vitest atau Jest.
* **Component Tests:** Setiap komponen UI harus diuji untuk state loading, kosong, error, dan *edge case*. Gunakan React Testing Library.
* **Integration Tests:** Operasi baca/tulis IndexedDB → UI, aliran antrean offline, siklus background sync.
* **E2E Tests:** Alur pengguna lengkap — tambah transaksi → lihat di dashboard → verifikasi update Net Worth. Gunakan Playwright.
* **Coverage:** Target minimal coverage 80% untuk kode logic keuangan dan komponen kritis.

---

## 9. Persyaratan Performa (Performance Requirements)

Setiap kode yang ditulis untuk FinSpace WAJIB mematuhi prinsip performa berikut. Regresi performa tidak ditoleransi.

### Bundle Size & Code Splitting
- **Lazy loading**: komponen berat (chart, modal, halaman baru) harus menggunakan `next/dynamic` + `loading` fallback. Dilarang import statis komponen yang tidak langsung terlihat di viewport pertama.
- **Tree shaking**: dilarang menggunakan wildcard import (`import *`). Import simbol spesifik saja.
- **Monitoring bundle**: sebelum setiap commit, jalankan `next build` dan periksa output size. Jika ada route >200KB (gzip), lakukan code splitting.
- **Vendor chunking**: library besar (Dexie, serwist) akan auto-split oleh Next.js. Jangan bundling ulang secara manual.

### Rendering Performance (React 19)
- **Minimal re-render**: gunakan `useMemo` untuk komputasi berat dan `useCallback` untuk callback yang diturunkan ke child components.
- **React.memo**: bungkus item daftar (list item, card) dengan `React.memo` jika props jarang berubah.
- **Key stabil**: gunakan `id` sebagai key di list. Dilarang menggunakan index array sebagai key untuk list dinamis.
- **Server Component优先**: jangan tambahkan `"use client"` ke seluruh halaman. Pindahkan interaktivitas ke komponen anak terkecil yang membutuhkannya.

### IndexedDB / Dexie Performance
- **Query presisi**: gunakan `where()`, `equals()`, `between()` — jangan fetch semua data lalu filter di JavaScript.
- **Bulk operations**: untuk multiple write/delete, gunakan `bulkAdd`, `bulkPut`, `bulkDelete`. Dilarang loop `await db.add()` per-item.
- **useLiveQuery scope**: hook ini re-render setiap perubahan tabel. Filter di query, bukan di komponen. Batasi scope query (misal: `timestamp >= startOfMonth` bukan `reverse().toArray()`).
- **Batasi data**: query hanya data yang diperlukan untuk render. Jangan fetch seluruh tabel tanpa filter temporal.

### Service Worker & Caching (Serwist)
- **Cache bloat**: jangan cache halaman dinamis (API routes, data user-specific) di SW. Gunakan `networkOnly` atau `staleWhileRevalidate` dengan batas entri maksimal.
- **Dev mode**: SW harus dinonaktifkan di development (`disable: true`) untuk mencegah reload loop. SW hanya aktif di production build.
- **Precache minimal**: hanya precache aset statis (JS/CSS chunks, font, icon). Jangan precache halaman HTML — gunakan `navigationPreload` + fallback `/~offline`.
- **SW ringan**: event `install` dan `activate` harus selesai dalam <5 detik. Dilarang fetch data eksternal di dalam service worker.

### Animasi & Interaksi
- **CSS-only**: prefer `transition` dan `animation` CSS. Dilarang menggunakan library animasi JavaScript untuk animasi sederhana.
- **Properti aman**: animasi hanya pada `transform` (translate, scale, rotate) dan `opacity` — properti ini tidak trigger layout/paint (di-accelerate oleh GPU).
- **will-change**: gunakan `will-change: transform` hanya pada elemen yang sedang dianimasikan. Hapus setelah selesai.
- **Debounce input**: form pencarian dan input real-time harus di-debounce (300ms) sebelum memicu query Dexie atau komputasi berat.
- **Virtual scroll**: daftar dengan 100+ item harus menggunakan infinite scroll atau virtual list. Dilarang render semua item sekaligus.

### Alat Ukur & Target
- **Lighthouse**: target skor PWA ≥ 90, Performance ≥ 85, Accessibility ≥ 90.
- **React DevTools Profiler**: gunakan flamegraph untuk mendeteksi re-render tidak perlu pada sesi debugging.
- **Chrome DevTools > Performance**: rekam interaksi pengguna dan cari long task (>50ms) di main thread.
- **Build output**: periksa `next build` output untuk setiap route sebelum merge.

### Larangan Mutlak
- ❌ Import library besar (chart, date picker) secara statis — gunakan dynamic import.
- ❌ Fetch ulang data yang sudah ada di IndexedDB/Dexie.
- ❌ Bypass Next.js Image Optimization — selalu gunakan komponen `<Image>` dengan `width` dan `height`.
- ❌ Blok main thread dengan synchronous IndexedDB loop — gunakan `await` + batch.
- ❌ Buat SW precache >50 entri tanpa audit berkala.
- ❌ Gunakan `dangerouslySetInnerHTML` — risiko XSS.
- ❌ Gunakan `any` di TypeScript — selalu gunakan tipe eksplisit.

---

## 10. Persyaratan Skalabilitas & Maintainability

* **Arsitektur Komponen:** Komponen kecil dan *single-purpose* di `src/components/` yang diorganisir per domain (`budget/`, `wealth/`, `ai/`, `shared/`).
* **Custom Hooks:** Semua operasi IndexedDB, status jaringan, dan logika form ditempatkan di `src/hooks/` — jaga data concerns tetap terpisah dari komponen.
* **TypeScript Strict:** Gunakan tipe eksplisit untuk semua skema database (Dexie/RxDB), respons API, dan props komponen. Hindari `any`.
* **Konstanta & Konfigurasi:** Ekstrak nilai warna, daftar kategori, aturan anggaran, dan *insight messages* ke `src/lib/constants.ts`. Dilarang menggunakan *magic numbers* di dalam komponen.
* **Batas Ukuran File:** Jika sebuah file melebihi 200 baris, pertimbangkan untuk memecahnya. File komponen sebaiknya tidak melebihi 150 baris.
* **Offline-First di Setiap Fitur:** Setiap fitur harus berfungsi tanpa koneksi jaringan. Jika fitur masa depan membutuhkan API eksternal, bungkus di belakang lapisan *repository/abstraction* sehingga jalur offline tetap bersih.