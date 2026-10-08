# 📋 FinSpace Development Task List

This document outlines the step-by-step implementation plan for FinSpace. Execute these tasks sequentially to maintain architecture integrity.

## Phase 1: Foundation & PWA Setup
- [x] Initialize Next.js project using App Router and TypeScript.
- [x] Configure Tailwind v4 theme in `globals.css` with design system tokens (DESIGN.md):
  - [x] Dark palette: `bg-background` (#020617), `bg-surface` (#1E293B), `bg-surface-alt` (#0F172A)
  - [x] Brand: `bg-primary` (#3B82F6), `bg-accent` (#EAB393), `bg-accent-secondary` (#723EC3)
  - [x] Semantic: `text-success` (#22C55E), `text-danger` (#EF4444), `bg-warning` (#FFCF95)
- [x] Install and configure PWA engine (`@serwist/turbopack`).
- [x] Create basic `manifest.json` and generate required app icons.
- [x] Register Service Worker and verify offline page caching capability in Chrome DevTools.

## Phase 2: Local Database Architecture
- [x] Install local database dependencies (`dexie` and `dexie-react-hooks`).
- [x] Initialize database instance and implement the `transactions` table schema.
- [x] Implement the `ai_queue` table schema to store offline AI actions.
- [x] Create custom React hooks for global CRUD operations on transactions (`useTransactions`).
- [x] Seed dummy transaction data to local storage for initial UI testing.

## Phase 3: Mobile-First Layout & Navigation
- [x] Create the global root layout with `bg-finance-cream` as the core background.
- [x] Implement the `BottomNavigationBar` component containing 4 core tabs:
  - [x] Dashboard
  - [x] Budget & Cashflow
  - [x] Wealth & Pockets
  - [x] Tools & Receipts
- [x] Implement a reusable `FloatingActionButton` (FAB) in `finance-purple` to trigger the AI Assistant.
- [x] Ensure layout works on mobile viewports ($< 640\text{px}$) with thumb-friendly navigation.

## Phase 3b: Desktop Responsiveness
- [x] Transition Bottom Navigation Bar to persistent sidebar at `≥1024px` (`lg` breakpoint).
- [x] Apply `max-w-7xl mx-auto` container to dashboard and data-heavy pages.
- [x] Tables, graphs, and transaction lists: horizontal layout on desktop, stacked cards on mobile.
- [x] Modals: centered dialogs with max-width on desktop, bottom-sheets on mobile.

## Phase 4: Module A – Budgeting & Cashflow
- [x] Build the Core Transaction Ledger view (List of incoming/outgoing flows).
- [x] Create the "Add Transaction" manual form modal using the proper color hierarchy.
- [x] Implement local category budgeting allocation engine (50/30/20 logic).
- [x] Build a visual categorical budget progress ring using standard SVG or lightweight charting library.
- [x] Integrate Web Bluetooth API utility to generate raw text data format for thermal printer connection.

## Phase 5: Module B & C – Client-Side Analytics Engine
- [x] Implement Client-Side Net Worth calculation logic (Assets minus Liabilities).
- [x] Build the Net Worth visualization card utilizing `finance-navy` as the background container.
- [x] Develop the Client-Side Financial Health Ratio calculations:
  - [x] Liquidity Ratio formula execution.
  - [x] Savings Rate percentage computation.
  - [x] Debt-to-Income safety margin verification.
- [x] Build a custom speedometer component reflecting the current health state (Safe, Warning, Danger) using `finance-peach` for warning highlights.

## Phase 5b: Performance Maintenance
- [x] Audit bundle size: `next build` — pastikan tidak ada route >200KB (gzip).
- [x] Pastikan semua dynamic import menggunakan `next/dynamic` + fallback loading.
- [x] Audit rendering: cek komponen list/card sudah pakai `React.memo` + key stabil.
- [x] Audit Dexie queries: ganti `toArray()` tanpa filter dengan `where()`/`between()`.
- [x] Audit SW caching: pastikan SW dinonaktifkan di dev, precache <50 entri.
- [x] Audit input debounce: search field dan form input yang memicu Dexie query.
- [x] Pastikan semua animasi hanya menggunakan `transform`/`opacity` — bukan properti layout.
- [x] Pastikan tidak ada import wildcard (`import *`) di seluruh codebase.
- [ ] Jalankan Lighthouse PWA + Performance audit, catat skor.

## Phase 5c: Full UI/UX Redesign (DESIGN.md — Tactile Analytics Interface)
- [x] Design Tokens: update `globals.css` — dark palette, Inter + JetBrains Mono fonts, semantic color tokens
- [x] Layout redesign: NavigationBar (mobile bottom nav + desktop sidebar), AppShell, FAB
- [x] Shared components redesign: ResponsiveModal, TransactionCard, TransactionList
- [x] Budget components redesign: BudgetRing, AddTransactionForm, budget page
- [x] Wealth components redesign: NetWorthCard, Speedometer, RatioCard, AssetLiabilityForm, wealth page
- [x] Dashboard + AI redesign: dashboard page, landing page, SmartInsights, ChatbotSheet, ChatMessage
- [x] Cleanup: update ~offline page, tools page to use new design tokens
- [x] AGENTS.md: replace old finance-* palette with new design tokens documentation

## Phase 5e: Dashboard UI Polish — Gradient Cards, Layout & Mobile Switcher Refactor
- [x] Wrapping balance / net worth cards in gradient glass (desktop + mobile)
- [x] Refactor `MobileCardSwitcher`: simplified to dots-only navigation + swipe gestures; cards are fully independent divs with gradient
- [x] `NetWorthCard`: added `className` + `style` props for external gradient styling
- [x] `NetWorthCard`: replaced `glass` class with `bg-surface` + `backdrop-blur-xl` + `border-border` to avoid `!important` override conflict with inline gradient
- [x] `HealthScoreRing`: simplified animation implementation, removed redundant root-level CSS
- [x] `SmartInsights`: visual polish pass — alignment, spacing, icon sizing
- [x] Export `getLiquidityStatus`, `getSavingsRateStatus`, `getDebtToIncomeStatus` from `financialRatios.ts` for wealth page

## Phase 5d: Glassmorphism + Theme Toggle
- [x] Add `.glass` utility class (frosted glass: backdrop-blur, semi-transparent bg, subtle border)
- [x] Add `ThemeContext` + `ThemeProvider` with localStorage persistence + system preference detection
- [x] Create `ThemeToggle` component (Sun/Moon icons) in sidebar + bottom nav
- [x] Apply `.glass` to all card containers across all pages
- [x] Add radial glow background in AppShell
- [x] Theme-aware backdrop overlay (`--backdrop-bg`: dark rgba(0,0,0,0.6) / light rgba(0,0,0,0.3))
- [x] Theme-aware card hover shadows (`--card-hover-shadow`)
- [x] Theme-aware sidebar separation shadow (`--sidebar-shadow`)
- [x] Theme-aware SVG track colors (`--color-track`)
- [x] Theme-aware glow opacities (`--glow-primary`, `--glow-accent`)
- [x] Fix BudgetRing hardcoded stroke colors → CSS variables
- [x] Fix SmartInsights border opacity for light mode
- [x] Fix loading skeleton visibility in light mode
- [x] Fix Speedometer arc color visibility in light mode
- [x] Fix empty state text contrast in light mode
- [x] Set `color-scheme` for native form controls per theme

## Phase 6: Module D & E – Hybrid AI Assistant & Smart Insights
- [x] Create the static `insights.json` file populated with contextual financial rules.
- [x] Build the `SmartInsights` component on the main dashboard driven by current ratio states.
- [x] Implement the UI for Chatbot "Finny" as a sliding Bottom Sheet container.
- [x] Implement Network Status listeners utilizing `navigator.onLine`.
- [x] Create the **Offline Queue Mechanism**:
  - [x] Write logic to intercept chatbot input / image scan when offline.
  - [x] Push payload into `ai_queue` with a status of `pending`.
  - [x] Implement sync manager to push queue items when network switches back online.

## Phase 7: Product Testing
- [x] Install testing framework (Vitest or Jest) and React Testing Library.
- [x] Write unit tests for financial formulas (Net Worth, Liquidity Ratio, Savings Rate, Debt-to-Income).
- [x] Write component tests for core UI components (loading, empty, error, edge-case states).
- [x] Write integration tests for IndexedDB read/write → UI feedback cycle.
- [ ] Write E2E tests for full user flow using Playwright (add transaction → dashboard → Net Worth update).
- [ ] Verify all tests pass in CI pipeline.

## Phase 8: Security & Compliance
- [ ] Validate and sanitize all user input fields (amount, merchant, category) before IndexedDB write.
- [x] Configure Content Security Policy (CSP) headers in `next.config.ts`.
- [ ] Implement encryption for sensitive PII fields using `crypto.subtle`.
- [x] Web Bluetooth: ensure device request only triggers on explicit button click.
- [ ] Run `npm audit` and resolve any critical vulnerabilities.

## Phase 9: Scalability & Maintainability
- [x] Organize `src/components/` by domain (`budget/`, `wealth/`, `ai/`, `shared/`).
- [x] Extract all custom hooks into `src/hooks/` (IndexedDB, network status, form logic).
- [ ] Move constants, categories, budget rules, and insight messages to `src/lib/constants.ts`.
- [x] Audit codebase for `any` types and replace with explicit TypeScript types.
- [ ] Split any file exceeding 200 lines into smaller modules.
- [x] Verify no circular imports exist in the dependency graph.

## Phase 3c: Net Worth Revision — Debt Tracking + Balance Integration
- [x] Task 1: Data layer — DebtEntry, new NetWorthResult, calculateNetWorth (balance + debts), debtUtils (installment), tests
- [x] Task 2: DebtForm component (name, amount, due-date, validation)
- [x] Task 3: PayDebtModal component (remaining balance, validation, Cicilan expense)
- [x] Task 4: DebtList component (progress bars, installment info, overdue badge)
- [x] Task 5: NetWorthCard breakdown (4 rows: Saldo Tercatat, Aset, Liabilitas, Utang)
- [x] Task 6: AssetLiabilityForm purchase toggle + purchase-from-balance flow
- [x] Task 7: Wealth page debt integration (debts, balance, purchase, NetWorthCard)
- [x] Task 8: Dashboard + MonthlyChart update with new NW formula

## Phase 3d: Pocket (Kantong) System
- [x] Task 1: Data layer — Pocket type, Dexie schema v2 (pockets table + pocketId index), usePockets hook, tests
- [x] Task 2: PocketCard, PocketGrid, PocketFormModal components
- [x] Task 3: Transaction integration — pocket selector in form, pocket name display, list filter
- [x] Task 4: Budget page — wire PocketGrid with add/rename modals and filter
- [x] Task 5: Wealth + Dashboard — totalBalance from sum of pocket balances

## Phase 3e: Internationalization (i18n) — Translate All Components
- [x] Task 1: Basic i18n infrastructure — LanguageProvider, useLanguage hook, translations.ts (en + id locales), LanguageSwitcher
- [x] Task 2: Translate TopBar/ProfileButton/LanguageSwitcher components (ProfileButton.tsx, LanguageSwitcher.tsx, TopBar.tsx)
- [x] Task 3: Translate all remaining 30 component files (Groups A–E) to use `t("namespace.key")` calls
  - [x] Group A — Navigation & Notifications (5 files)
  - [x] Group B — Transaction Components (5 files)
  - [x] Group C — Budget Components (4 files)
  - [x] Group D — Wealth Components (5 files)
  - [x] Group E — AI, Tools, Dashboard, Settings, Landing (11 files)
  - [x] `src/lib/financialRatios.ts` — accept `t` parameter
  - [x] Server Components — add `"use client"` where needed
  - [x] `translations.ts` — extend with ~60+ new keys across all namespaces
  - [x] `LanguageProvider.tsx` — add fallback `t()` for test compatibility
  - [x] Round 2: Add ~80+ missing translation keys (insights, receipt, print, pdf_report, pockets, ai, financial)
  - [x] Round 3: Translate hardcoded Indonesian strings in TransactionHistory, receiptPdf, TransactionList, dashboard/month headers
  - [x] Finny AI: Thread language preference from client through API to system prompt builders (`buildSystemPrompt`, `buildScanPrompt`)
  - [x] Localize API route error messages and hook fallback messages
  - [x] TypeScript compiles clean (`npx tsc --noEmit`)
  - [x] All 116 tests pass (`npx vitest run`)

## Phase 3f: Error Fixes & Polish
- [x] Fix Settings page hydration mismatch: add `mounted` guard around sync status indicator
- [ ] Fix React 19 dev-only `<script>` warning in layout (harmless in production, dev-only)
- [x] Landing page: macOS-style title bar (traffic light dots) on preview dashboard
- [x] Landing page: replace bar chart with SVG line chart (income/expense curves)
- [x] Landing page: modernize chart — gradient area fill, no grid, no dots, clean curves
- [x] Landing page: add Back to Top button above footer
- [x] Landing page: improve footer — GitHub link, tech note, v1.0 badge, desktop divider, premium copyright bar
- [x] Mobile nav: smooth tab switching animation — sliding indicator, icon scale (active scale-110 / inactive scale-95), FAB hover lift
- [x] Wealth sync: purge legacy localStorage keys after migration — fixes deleted assets ("Investasi", "Dana Darurat") resurrecting via re-migration + Dexie Cloud put-over-tombstone on refresh
- [x] Wealth edit: pencil buttons on assets/liabilities/debts — AssetLiabilityForm + DebtForm edit mode (prefill, preserve id/createdAt/paidAmount, locked type toggle, overdue-editable due dates)
- [x] 3-bucket categories: Kebutuhan/Keinginan/Tabungan only (forms, Finny prompts, labels) — legacy categories keep mapping; transfers ("Pindah Saldo") excluded from budget + all income/expense totals (dashboard, budget, wealth); dynamic ring % labels
- [x] Savings ring: fills from Tabungan-category transactions (income+expense, transfers excluded) vs savings target — full ring shows "Tabungan bulanan telah terpenuhi"
- [x] Budget settings modal v2: numeric % inputs with two-way slider binding + custom slider styling (per-bucket color track/thumb, hover scale)
- [x] Budget settings modal v3: editable Rp nominal per bucket (draft-while-typing, commits to % on blur/Enter)
- [x] Mobile overflow hardening: overflow-x-clip page guard, flex-wrap filter buttons, min-w-0 grid children, break-words long text, wrapping balance row (fixes "zoomed"/sideways-shift on dashboard + budget)
- [x] Desktop sidebar: collapse toggle moved from bottom to header (next to FinSpace title); collapsed logo replaced with open-sidebar icon button
- [x] Cash flow chart: dual-series income (green) + expense (red) in one view with legend + tooltips; range pills Hari/Minggu/Bulan/Tahun (14 hari, 12 minggu, 12 bulan, 5 tahun); transfers excluded; net-worth tab kept
- [x] Receipt scan endless-spinner: camera captures now downscaled to 1600px (was full sensor res → oversized body/timeout); API maxDuration 60s + oversize guard + missing-key diagnostic; client 90s abort timeout
- [x] Finny roomchat (/finny): persistent sessions + messages in Dexie (v6 tables, synced) — session list with resume/delete/new, auto-resume latest; floating button opens a fresh persisted session; external-link icon in sheet header opens the room
- [x] Finny roomchat entry in desktop sidebar only (active state + collapsed icon mode; mobile bottom bar unchanged)
- [x] Finny persistence fixes: Dexie Cloud `@`-key prefixes centralized (src/lib/ids.ts + regression test) — finny sessions/messages, liabilities (lbl), offline queue (aq), deleted-preset markers; chat turns persisted inline per message; seed-once-poison race fixed (verified end-to-end in browser: history survives reload)
- [x] FinnyInput multiline (auto-growing textarea, Enter send / Shift+Enter newline); receipt scan (camera + gallery) inside roomchat via FinnyInput button
- [x] Roomchat overlays portaled to document.body (camera, scan result, mobile session drawer) — fixes AppShell <main> stacking context trapping them below sidebar/topbar
- [x] Cross-device live sync: CSP connect-src now allows wss://*.dexie.cloud (live channel was blocked — updates only arrived on login); autosync fallback pulls on tab-focus/reconnect
- [x] Roomchat session swap fixed: seed effect ignores stale rows from the previous session (selecting A no longer shows B); covered by A→B→A regression test (proven to fail without the guard)
- [x] Finny session rename (inline edit per session) + AI topic titles: background title call after first turn (max 5 words, user language); manual renames always win (shouldApplyAiTitle guard, tested)
- [x] Finny room mobile locked: fixed-height flex layout (overflow-hidden) — page never scrolls, only the chat area does; desktop flow unchanged
- [x] Finny scroll-to-bottom button (appears when scrolled up, smooth scroll); new messages no longer yank readers away from history
- [x] Finny live FX rates (open.er-api.com, cached 12h server-side, static fallback) injected into chat + scan prompts — verified live: $5 → Rp89.510 @ Rp17.902
- [x] Finny capabilities: per-request financial snapshot (balances, monthly totals, 20 recent tx, assets, debts, net worth) so it answers totals/history + gives data-based advice; new transfer_pocket action with preview + execution; FX-to-IDR rule for chat + scan receipts
- [x] Monthly report PDF excludes pocket transfers from income/expense totals, category breakdowns, top-5 and detail table (single filter at entry via isTransferTransaction)
- [x] Version bump 1.5.0 → 1.6.0
- [x] Pagination (shared usePagination + PaginationControls): transaction history 10/page with filter-reset; wealth assets/liabilities/debts 5/page
- [x] Pagination page-size selector (15/25/50/75, default 15) on all paginated lists
- [x] Daily expense reminders (12:00/17:00/21:00): local scheduled notifications via SW + in-app bell entry, skipped when an expense was already logged, per-day dedupe, Settings toggle with permission flow
- [x] Health label unified: scoreToStatus() shared by dashboard ring + wealth speedometer (≥70 safe, ≥40 warning) — skor 74 kini Aman di kedua halaman; ring pakai kunci i18n financial.score_*
- [x] Income category fixed: form pemasukan kini pakai dropdown 3-bucket (sebelumnya hardcoded "Pemasukkan" di luar sistem)
- [x] Preset resurrection guard: deleted-preset markers synced (app_meta, v7) — kantong preset yang dihapus user takkan di-seed ulang di perangkat mana pun
- [x] Version bump 1.0.0 → 1.5.0 (package.json + lockfile, landing badge, receipt/PDF footers; About modal follows via APP_VERSION)
- [x] Scan "unreadable" fix: strict raw-JSON-only prompt rule + temperature 0 + balanced-brace multi-candidate parser (scan-parse.ts, tested) + server logging of unparseable output
- [x] Asset purchase from balance: pocket selector (with balance + insufficient warning) when "beli dari saldo" checked; expense linked to chosen pocket
- [x] Finny preview resurrection fixed: handled flag on chat messages (saved/dismissed previews never reopen on revisit — also kills duplicate saves); shared isActionableMessage() helper, tested
- [x] Finny per-message language: replies follow the user's message language (client detection + strict per-request directive); AI titles follow too; offline/error fallbacks localized the same way
- [x] Version bump 1.6.0 → 1.7.0
- [x] Finny unsend: undo button on user bubbles aborts in-flight replies, removes both bubbles (state + Dexie), refills input for editing; emptied sessions deleted; seed guards against resurrecting unsent rows (verified live in browser)
- [x] Wealth subpages: /wealth/assets (full lists + add/edit/delete + pagination) and /wealth/debts (full list + modals + payoff simulator); main page slimmed to top-3 view-only + Lihat Semua links (shared WealthLists rows, useWealthData hook, view-only DebtList)
- [x] Budget subpages mirror: /budget/pockets (full pocket management incl. pocket→transactions deep-link filter) and /budget/transactions (full list + filters + ?q= search target); main page slimmed to rings + balance strip + recent-10 + links; sidebar budget dropdown added (shared DropdownNavItem)
- [x] Wealth main add-button restored (text-on-primary) + empty-state add buttons per segment; assets page header button fixed to text-on-primary
- [x] Sidebar wealth dropdown (desktop): expandable Aset & Liabilitas + Utang sublinks with animated reveal, auto-expands on subroutes
- [x] Transaction month/year filter (full list only): month + year dropdowns with dynamic year options, pagination-safe, tested via isInMonthYear()
- [x] Empty-result fix: filter bar + pagination stay mounted when a filter yields zero rows (only the table area shows empty)
- [x] Version bump 1.7.0 → 1.8.0
- [x] Dashboard view-all links: transaction history → budget, holdings → wealth/assets, debts → wealth/debts
- [x] Dashboard restructure: NetWorthCard detail toggle replaced by asset/liability/debt COUNT segments; top-3 pockets strip; bottom rows reordered to history+holdings and health+debts (new TopHoldingsCard, DebtSnapshotCard)

## Phase 10: Deployment & Final Acceptance Testing
- [ ] Build a robust suite of validation test scenarios for simulated offline state.
- [ ] Validate desktop responsiveness at viewport widths up to 1920px.
- [ ] Audit accessibility color contrast scores across all components to hit the $\ge 4.5:1$ threshold.
- [ ] Configure deployment triggers on Vercel.
- [ ] Run full Lighthouse PWA verification check and lock the production release.