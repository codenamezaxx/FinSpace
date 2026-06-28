# Task 8 Report — Dashboard + MonthlyChart Update

## Summary

Wired up balance and debts in the dashboard Net Worth calculation and updated the MonthlyChart to display the new formula. The net worth now correctly includes both the all-time cash balance and outstanding debts.

## Changes

### `src/lib/monthlyChart.ts`
- Imported `DebtEntry` type
- Updated `computeMonthlyNetWorth` signature to accept `balance: number` and `debts: DebtEntry[]`
- Computes `debtsUpTo` per month (filtering by `createdAt`, using `paidAmount` for remaining)
- New formula: `value = balance + assetsUpTo - liabilitiesUpTo - debtsUpTo`

### `src/components/dashboard/MonthlyChart.tsx`
- Imported `DebtEntry` type
- Added optional `debts: DebtEntry[]` and `balance: number` to `MonthlyChartProps`
- Destructured new props with defaults (`[]` and `0`)
- Updated `useMemo` to pass `balance` and `debts` to `computeMonthlyNetWorth`

### `src/app/dashboard/page.tsx`
- Added imports: `loadFromStorage` from `@/lib/storage`, `DebtEntry` type
- Added `const { transactions: allTransactions } = useTransactions()` for all-time balance
- Replaced `liquidAssets` and `netWorthData` useState with derived `useMemo` values:
  - `totalBalanceAll` — all-time income minus expense from `allTransactions`
  - `liquidAssets` — derived from `assetsList` (liquid filter)
  - `netWorthData` — derived via `calculateNetWorth(assetsList, liabilitiesList, totalBalanceAll, debtsList)`
- Added `debtsList` state + useEffect to load from localStorage (`finspace_debts`) with event listener
- Simplified `loadAssets` to only set `assetsList` and `liabilitiesList` (no more manual `setLiquidAssets`/`setNetWorthData`)
- Passed `debts={debtsList}` and `balance={totalBalanceAll}` to `<MonthlyChart>`

## Verification
- `npm run build` — zero errors
- `npx vitest run` — all 9 tests pass (4 netWorth + 5 debtUtils)
