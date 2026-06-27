# Dashboard Monthly Chart — Design Spec

## Overview

Add a switchable line chart card below the Quick Actions section on the Dashboard page that visualizes (a) monthly income and (b) monthly net worth, each for the past 12 months. Works identically on mobile and desktop.

---

## Data Layer Changes

### `AssetEntry` & `LiabilityEntry` (src/lib/netWorth.ts)

Add optional `createdAt: number` (Unix ms) to both interfaces. Existing entries without `createdAt` get treated as "existed since the beginning of tracking" (createdAt = 0).

```typescript
export interface AssetEntry {
  id: string;
  name: string;
  amount: number;
  type: "liquid" | "investment" | "property" | "other";
  createdAt?: number;   // NEW — timestamp when entry was created
}

export interface LiabilityEntry {
  id: string;
  name: string;
  amount: number;
  createdAt?: number;   // NEW
}
```

### AssetLiabilityForm (src/components/wealth/AssetLiabilityForm.tsx)

Set `createdAt: Date.now()` on every new asset/liability entry. Existing load path in `wealth/page.tsx` handles missing `createdAt` gracefully (defaults to 0 = "always existed").

### Net Worth History Computation

New file `src/lib/monthlyChart.ts` with:

```typescript
function computeMonthlyNetWorth(
  assets: AssetEntry[],
  liabilities: LiabilityEntry[],
  months: number
): Array<{ month: string; netWorth: number }>
```

For each of the past `months` (default 12):
1. Compute month-end timestamp
2. Filter assets where `(createdAt ?? 0) <= monthEnd`
3. Filter liabilities where `(createdAt ?? 0) <= monthEnd`
4. Net worth = sum(assets) - sum(liabilities)

---

## Chart Library

**Recharts** — installed as `recharts` via npm. No additional plugins needed.

- `<ResponsiveContainer>` — fluid width/height
- `<LineChart>` — primary chart component
- `<Line>` — smooth curve (`type="monotone"`), gradient stroke
- `<XAxis>` / `<YAxis>` — month labels, formatted Rupiah
- `<Tooltip>` — hover detail
- `<CartesianGrid>` — subtle grid lines

---

## Component: MonthlyChart

### File
`src/components/dashboard/MonthlyChart.tsx` — client component (`"use client"`)

### Dynamic Import (in dashboard page)
```typescript
const MonthlyChart = dynamic(() => import("@/components/dashboard/MonthlyChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

### Props
```typescript
interface MonthlyChartProps {
  transactions: Transaction[];
  assets: AssetEntry[];
  liabilities: LiabilityEntry[];
}
```

### Internal State
- `view: "income" | "netWorth"` — which chart to show

### Data Processing (useMemo)

**Income view:**
1. Filter transactions with `type === "income"`
2. Generate 12 month periods (end-of-month timestamps)
3. For each month, sum income amounts
4. Result: `Array<{ month: string; income: number }>`

**Net Worth view:**
1. Generate 12 month periods
2. For each month, compute net worth from filtered assets/liabilities (see data layer above)
3. Result: `Array<{ month: string; netWorth: number }>`

### Rendering

```
┌──────────────────────────────────────┐
│ 📈 Tren Keuangan                     │
│ ┌──────────┬──────────────────┐      │
│ │Pendapatan│ Kekayaan Bersih   │      │
│ └──────────┴──────────────────┘      │
│                                      │
│    [Line Chart via Recharts]         │
│    • Smooth line, gradient fill      │
│    • X: bulan (Jan–Des)              │
│    • Y: Rp, abbreviated              │
│    • Tooltip: nama bulan + amount    │
│    • Subtle grid                     │
│                                      │
└──────────────────────────────────────┘
```

### Styling
- Card wrapper: `glass rounded-2xl p-5`
- Toggle tabs: same style as GlobalTransactionModal (`border border-border bg-surface-alt p-1 rounded-xl`)
- Active tab: `bg-primary text-white`
- Inactive tab: `text-text-muted`
- Chart colors: primary blue for income, accent-secondary (purple) for net worth
- Gradient area fill: `url(#incomeGradient)` / `url(#netWorthGradient)`

---

## Dashboard Integration

### Placement
Insert after the Quick Actions section (`{/* ── Quick Actions ── */}`) and before `{/* ── Bottom: Smart Insights + Transaction History ── */}`.

### Data Wiring
- Pass `transactions` from existing `useTransactions` down to MonthlyChart
- Load `assets`/`liabilities` from localStorage (or extract from wealth page's `loadFromStorage`)
- Use `calculateNetWorth` from `@/lib/netWorth` for the final current-month anchor point

### Code Location

File: `src/app/dashboard/page.tsx`
After the Quick Actions div, add:
```tsx
{/* ── Monthly Trend Chart ── */}
<MonthlyChart
  transactions={transactions}
  assets={assets}
  liabilities={liabilities}
/>
```

---

## Error & Edge Cases

| Case | Behavior |
|------|----------|
| No transactions in a month | Line shows 0 for that month |
| No assets/liabilities at all | Net worth line shows 0 across all months |
| Empty state (no data at all) | Chart renders with a flat line at 0, tooltip still works |
| Loading | Skeleton placeholder while dynamic import loads |
| Only 1 month of data | Single point — Recharts handles gracefully |
| createdAt is undefined (migrated data) | Treated as createdAt=0 (included in all months) |

---

## Performance

- **Dynamic import** (`next/dynamic` with `ssr: false`) prevents Recharts from bloating the initial bundle
- **Data computation** in `useMemo` — only recalculates when `transactions`, `assets`, or `liabilities` change
- **Recharts bundle** is ~35 KB gzipped — acceptable for a chart library
- No unnecessary re-renders — chart is a pure function of the three data props

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/netWorth.ts` | Add `createdAt?: number` to both interfaces |
| `src/lib/monthlyChart.ts` | **New file** — `computeMonthlyNetWorth()` + `computeMonthlyIncome()` helpers |
| `src/lib/storage.ts` | **New file** — shared `loadFromStorage<T>()` utility (moved from wealth/page.tsx) |
| `src/components/wealth/AssetLiabilityForm.tsx` | Set `createdAt: Date.now()` on save |
| `src/components/dashboard/MonthlyChart.tsx` | **New file** — chart card component |
| `src/app/dashboard/page.tsx` | Import + render MonthlyChart; load assets/liabilities |
| `package.json` | Add `recharts` dependency |
