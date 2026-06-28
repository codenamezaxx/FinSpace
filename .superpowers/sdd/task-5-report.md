# Task 5 Report — NetWorthCard Breakdown Display

## Changes Made

### 1. `src/components/wealth/NetWorthCard.tsx` — Complete rewrite
- **Removed** `"use client"` directive — now a Server Component
- **Changed props** from `{ data: NetWorthResult }` to flat props: `{ totalBalance, totalAssets, totalLiabilities, totalDebts, netWorth, title?, className? }`
- **Added** `Banknote` icon import from `lucide-react` for the "Saldo Tercatat" row
- **Removed** `memo`, `ArrowUpIcon`, `ArrowDownIcon`, `type CSSProperties` imports (no longer needed)
- **New layout**: 4 breakdown rows (Saldo Tercatat, Total Aset, Total Liabilitas, Total Utang) with ± prefix + total net worth row
  - Saldo Tercatat: green (`text-success`), shows `Banknote` icon
  - Total Aset: green (`text-success`)
  - Total Liabilitas: red (`text-danger`) with `-` prefix
  - Total Utang: red (`text-danger`) with `-` prefix
  - Net Worth total: green/red depending on sign, with "Positif"/"Negatif" badge
- **BreakdownRow** helper component: accepts optional `children` for icon, `negative` flag for ± prefix
- Same styling patterns: `bg-surface/50`, `border-border`, `font-mono`, hover lift effect

### 2. `src/app/wealth/page.tsx` — Updated consumer
- `calculateNetWorth(assets, liabilities)` → `calculateNetWorth(assets, liabilities, 0, [])` (pass all 4 args)
- `<NetWorthCard data={netWorthData} />` → flat props spread from `netWorthData`

### 3. `src/app/dashboard/page.tsx` — Updated consumer
- `NetWorthResult` state init: added missing `totalBalance: 0`, `totalDebts: 0`
- `calculateNetWorth(assets, liabilities)` → `calculateNetWorth(assets, liabilities, 0, [])` (pass all 4 args)
- `<NetWorthCard data={netWorthData} ... />` → flat props spread from `netWorthData`
- Removed `style` prop (no longer accepted — component has built-in glass styling)

## Concerns
- **Dashboard gradient removed**: The `style` prop with gradient background was dropped since the new component doesn't accept `style`. The default `bg-surface/50` glass styling applies instead.
- **Wealth & Dashboard pages**: Both pass `0` and `[]` as placeholders for `balance` and `debts`. When those features are implemented, real values should be wired in (future task).
