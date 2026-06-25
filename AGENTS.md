# FinSpace — Agent Instructions

## Scope

Compact execution guide for OpenCode sessions. Read **PRD.md** for full product spec and **task.md** for tracked tasks. Both are the source of truth for what to build and in what order.

---

## Quick Start

```bash
npm run dev    # dev server at localhost:3000
npm run build  # production build
npm run lint   # ESLint check
```

---

## Tech Stack (pinned)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router + React 19 | `src/app/` directory |
| Styling | Tailwind CSS v4 | Uses `@import "tailwindcss"` + `@theme` directive in `globals.css` — **NOT** a `tailwind.config.js` |
| Local DB | Dexie.js or RxDB | Not yet installed |
| PWA | serwist or next-pwa | Not yet configured |
| Icons | Lucide React (preferred) | |
| Hosting | Vercel | |

---

## Tailwind v4 — Color Palette

Tailwind v4 uses `@theme` inside `globals.css` — **do not create `tailwind.config.js`**.

Custom colors are defined via `@theme` in `globals.css` — **do not create `tailwind.config.js`**.

The palette uses semantic CSS variables (see DESIGN.md for full specs):

| Token | Tailwind class | Hex |
|---|---|---|
| Background | `bg-background` | `#020617` |
| Surface | `bg-surface` | `#1E293B` |
| Surface Alt | `bg-surface-alt` | `#0F172A` |
| Primary | `bg-primary` | `#3B82F6` |
| Accent | `bg-accent` | `#EAB393` |
| Accent Secondary | `bg-accent-secondary` | `#723EC3` |
| Border | `border-border` | `#334155` |
| Text Primary | `text-text-primary` | `#FFFFFF` |
| Text Secondary | `text-text-secondary` | `#94A3B8` |
| Text Muted | `text-text-muted` | `#64748B` |
| Success | `text-success` | `#22C55E` |
| Danger | `text-danger` | `#EF4444` |
| Warning | `bg-warning` | `#FFCF95` |

Usage: `bg-background`, `bg-surface`, `text-text-primary`, `text-text-muted`, `bg-primary`, `border-border`, `font-mono` for amounts.

Palette roles — dark theme "Tactile Analytics Interface" (see DESIGN.md):
- `#020617` (`bg-background`) — page background
- `#1E293B` (`bg-surface`) — card/panel surfaces
- `#0F172A` (`bg-surface-alt`) — sidebar, alt surfaces
- `#3B82F6` (`bg-primary`) — CTAs, active states, brand blue
- `#EAB393` (`bg-accent`) — warm accent (gold)
- `#723EC3` (`bg-accent-secondary`) — purple accent (kept from old palette)
- `#334155` (`border-border`) — all borders
- `#FFCF95` (`bg-warning`) — warning badges (kept from old palette)
- `#22C55E` (`text-success`) — income/green
- `#EF4444` (`text-danger`) — expense/red
- `#FFFFFF` (`text-text-primary`) — headings, nav active
- `#94A3B8` (`text-text-secondary`) — body text
- `#64748B` (`text-text-muted`) — muted/secondary text

Accessibility: text on `bg-primary` or `bg-accent-secondary` must be white (`#FFFFFF`) — WCAG 4.5:1 minimum.

---

## Architecture Constraints

- **Offline-first**: all reads/writes against IndexedDB first. Never fetch external API for primary UI.
- **AI Queue**: offline chatbot/scanner input goes into `ai_queue` table (IndexedDB), synced via Service Worker Background Sync when online.
- **Client-side math**: Net Worth and Financial Health Ratios (Liquidity, Savings Rate, Debt-to-Income) computed in JS only — see PRD §3 Modul C for formulas.
- **Bottom Navigation** — 4 tabs (Dashboard, Budget, Wealth, Tools), FAB for AI Assistant.

---

## Desktop Responsiveness

Mobile-first does **not** mean desktop-only. Every page/component must scale gracefully to large viewports.

Rules:
- Bottom Navigation Bar transitions to a persistent **sidebar** at `≥1024px` (lg breakpoint). Keep the same 4 tabs; change orientation only.
- Max content width `1280px` (`max-w-7xl mx-auto`) for dashboard and data-heavy pages. Never full-bleed on desktop.
- Tables, graphs, and transaction lists should use horizontal space — more columns visible on desktop, stacked cards on mobile.
- No hardcoded pixel widths. Use Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).
- Modals: use centered dialogs with max-width on desktop, bottom-sheets on mobile.

---

## Performance

Setiap perubahan kode wajib menjaga performa produk tetap maksimal. Prinsip berikut bersifat **wajib** — tidak ada toleransi untuk regresi performa.

### Bundle Size & Code Splitting
- **Lazy loading**: komponen berat (chart, modal, halaman) gunakan `next/dynamic` dengan `loading` fallback. Jangan import statis komponen yang tidak langsung terlihat.
- **Tree shaking**: hindari import * (wildcard). Import spesifik: `import { Plus } from "lucide-react"` bukan `import * as Icons`.
- **Monitor bundle**: sebelum commit, pastikan tidak ada peningkatan signifikan di bundle JS. Gunakan `next build` dan periksa output size.
- **Split vendor chunks**: library besar (Dexie, serwist) sudah auto-split oleh Next.js. Jangan bundling ulang secara manual.

### Rendering Performance (React 19)
- **Minimalkan re-render**: gunakan `useMemo` dan `useCallback` untuk komputasi berat dan callback yang diwariskan ke child.
- **React.memo**: bungkus komponen daftar (list item, card) dengan `React.memo` jika ia menerima props yang jarang berubah.
- **Key props**: selalu gunakan key yang stabil (`id`) saat `.map()` — jangan gunakan index sebagai key untuk list dinamis.
- **Client vs Server**: gunakan Server Component (`"use client"` tidak otomatis). Pindahkan interaktivitas ke bagian terkecil yang membutuhkannya — jangan jadikan seluruh halaman sebagai client component.

### IndexedDB / Dexie Performance
- **Query selektif**: jangan fetch semua data lalu filter di JS. Gunakan `where()`, `equals()`, `between()` untuk query yang presisi.
- **Bulk operations**: untuk multiple write/delete, gunakan `bulkAdd`, `bulkPut`, `bulkDelete` — bukan loop per-item.
- **useLiveQuery bijak**: hook ini re-render setiap kali tabel berubah. Filter di query, bukan di komponen. Hindari query besar di komponen yang sering mount/unmount.
- **Batasi scope**: jika hanya perlu data bulan ini, query dengan `timestamp >= startOfMonth` — jangan `reverse().toArray()` tanpa filter waktu.

### Service Worker & Caching
- **Cache bloat**: jangan cache halaman dinamis (API routes, user-specific data) di SW. Gunakan `networkOnly` atau `staleWhileRevalidate` dengan batas maksimal entri.
- **SW update cycle**: dev mode harus nonaktifkan SW (`disable` di development) untuk mencegah reload loop. Hanya aktifkan SW di production.
- **Precache minimal**: hanya precache aset statis (JS/CSS chunks, font, icon). Jangan precache halaman HTML — gunakan `navigationPreload` + fallback offline.
- **Hindari blocking**: SW `install` dan `activate` harus selesai cepat (<5 detik). Jangan fetch data eksternal di SW worker.

### Animasi & Interaksi
- **CSS-only animasi**: prefer `transition` dan `animation` CSS daripada JS animation library. Gunakan transform (`translate`, `scale`, `rotate`) dan `opacity` — properti ini tidak trigger layout/paint.
- **will-change**: gunakan `will-change: transform` hanya untuk elemen yang dianimasikan, dan hapus setelah selesai.
- **Debounce input**: form field pencarian gunakan debounce (300ms) sebelum memicu query Dexie.
- **Virtual scroll**: untuk daftar 100+ item, gunakan infinite scroll atau virtual list — jangan render semua item sekaligus.

### Alat Ukur Performa
- **Lighthouse**: target skor PWA ≥ 90, Performance ≥ 85, Accessibility ≥ 90.
- **React DevTools**: profiling flamegraph untuk deteksi re-render tidak perlu.
- **Chrome DevTools > Performance**: rekam interaksi pengguna, cari long task (>50ms) di main thread.
- **next build output**: perhatikan ukuran tiap route. Jika satu route >200KB (gzip), splitting diperlukan.

### Larangan Mutlak
- ❌ Jangan import library besar (charting, date) secara statis di client component. Gunakan dynamic import.
- ❌ Jangan fetch ulang data yang sudah ada di Dexie. Store dulu, lalu query dari store.
- ❌ Jangan bypass Next.js Image Optimization (`<Image>` komponen) untuk gambar lokal — selalu gunakan Next.js Image dengan `width`/`height`.
- ❌ Jangan blok main thread dengan synchronous IndexedDB loop. Gunakan `await` dan batch operations.
- ❌ Jangan buat SW precache >50 entri — audit dan kurangi secara berkala.

---

## Testing

Write tests before or alongside implementation. The project should eventually have:

- **Unit tests** — pure logic: financial formulas, Net Worth calculations, ratio computations. Use Vitest or Jest.
- **Component tests** — each UI component renders correctly for loading/empty/error/edge-case states. Use React Testing Library.
- **Integration tests** — store reads/writes (Dexie/RxDB → UI), offline queue flow, background sync cycle.
- **E2E tests** — full user flows: add transaction → see it in dashboard → verify Net Worth updates. Use Playwright for browser-based tests.

Test naming convention: `*.test.ts` or `*.test.tsx` co-located next to the file under test.

---

## Security

- **Input validation**: validate and sanitize all user inputs (amounts, merchant names, categories) before writing to IndexedDB. Never store raw HTML — treat all data as text.
- **XSS prevention**: React handles most cases via JSX escaping. For `dangerouslySetInnerHTML` — **never use it**. For any AI-generated content from chatbot, sanitize before rendering.
- **Content Security Policy**: configure CSP headers in `next.config.ts` or Vercel `vercel.json` to restrict script sources.
- **Sensitive data**: do not log or store full financial account numbers, passwords, or personal IDs in IndexedDB without encryption. Consider `crypto.subtle` for encrypting PII fields at rest.
- **Web Bluetooth**: request device only on explicit user gesture (button click). Never scan automatically.
- **Dependencies**: run `npm audit` before commits. Pin runtime deps to exact versions via lockfile.

---

## Scalability & Maintainability

- **Component architecture**: prefer small, single-purpose components in `src/components/` organized by domain (`budget/`, `wealth/`, `ai/`, `shared/`).
- **Custom hooks** in `src/hooks/` for all IndexedDB operations, network status, and form logic — keep data concerns out of components.
- **TypeScript strictness**: the config already sets `strict: true`. Use explicit types for all Dexie/RxDB schemas, API responses, and component props. Avoid `any`.
- **Constants & config**: extract color values, category lists, budget rules, and insight messages into `src/lib/constants.ts`. No magic numbers in components.
- **No circular imports**: keep a clean dependency graph — components import hooks, hooks import lib/db, lib/db depends on nothing in components.
- **File size budget**: if a file exceeds 200 lines, consider splitting. Component files should stay under 150 lines.
- **Offline-first everywhere**: every feature must work without network. If a future feature needs an external API, wrap it behind a repository/abstraction layer so the offline code path stays clean.

---

```
src/app/
  globals.css   # Tailwind v4 theme + custom colors
  layout.tsx    # Root layout (Geist font)
  page.tsx      # Landing page (still boilerplate)
task.md         # Active task checklist — read first before any work
PRD.md          # Full product requirement document
AGENTS.md       # This file
```

The project is in early stage: only the Next.js scaffold exists. No PWA, no database, no custom components beyond boilerplate.

---

## Task Tracking

- Every task lives in `task.md` with checkbox status `- [ ]` / `- [x]`.
- Always update `task.md` when starting or completing work.
- Add new tasks at the end under the appropriate phase if they are missing.
- Do not delete completed tasks — mark them `[x]`.

---

## Document Reference Hierarchy

1. `task.md` — what to do next (active task list)
2. `PRD.md` — product spec, formulas, data schemas, acceptance criteria
3. `AGENTS.md` — this file, repo-specific agent workflow guidance

When in doubt about implementation, check PRD.md first. When deciding what to work on, check task.md first.
