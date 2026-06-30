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
- [ ] Install testing framework (Vitest or Jest) and React Testing Library.
- [ ] Write unit tests for financial formulas (Net Worth, Liquidity Ratio, Savings Rate, Debt-to-Income).
- [ ] Write component tests for core UI components (loading, empty, error, edge-case states).
- [ ] Write integration tests for IndexedDB read/write → UI feedback cycle.
- [ ] Write E2E tests for full user flow using Playwright (add transaction → dashboard → Net Worth update).
- [ ] Verify all tests pass in CI pipeline.

## Phase 8: Security & Compliance
- [ ] Validate and sanitize all user input fields (amount, merchant, category) before IndexedDB write.
- [ ] Configure Content Security Policy (CSP) headers in `next.config.ts`.
- [ ] Implement encryption for sensitive PII fields using `crypto.subtle`.
- [ ] Web Bluetooth: ensure device request only triggers on explicit button click.
- [ ] Run `npm audit` and resolve any critical vulnerabilities.

## Phase 9: Scalability & Maintainability
- [ ] Organize `src/components/` by domain (`budget/`, `wealth/`, `ai/`, `shared/`).
- [ ] Extract all custom hooks into `src/hooks/` (IndexedDB, network status, form logic).
- [ ] Move constants, categories, budget rules, and insight messages to `src/lib/constants.ts`.
- [ ] Audit codebase for `any` types and replace with explicit TypeScript types.
- [ ] Split any file exceeding 200 lines into smaller modules.
- [ ] Verify no circular imports exist in the dependency graph.

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

## Phase 10: Deployment & Final Acceptance Testing
- [ ] Build a robust suite of validation test scenarios for simulated offline state.
- [ ] Validate desktop responsiveness at viewport widths up to 1920px.
- [ ] Audit accessibility color contrast scores across all components to hit the $\ge 4.5:1$ threshold.
- [ ] Configure deployment triggers on Vercel.
- [ ] Run full Lighthouse PWA verification check and lock the production release.