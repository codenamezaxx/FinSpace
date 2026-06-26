# Global Transaction Modal — Design Spec

## Summary

Replace the page-local `AddTransactionForm` with a global `TransactionModalContext` + `GlobalTransactionModal` so any button anywhere (sidebar, dashboard, budget) can open the same add-transaction modal.

## Architecture

```
TransactionModalContext.Provider  ← wraps AppShell content
  ├─ GlobalTransactionModal      ← rendered once, reacts to context state
  ├─ AppShell                    ← existing layout
  │   ├─ NavigationBar           ← sidebar "Tambah Transaksi" → context.open()
  │   ├─ dashboard/page.tsx      ← "Tambah Transaksi Baru" → context.open()
  │   └─ budget/page.tsx         ← "Add Transaction" → context.open()
  └─ ...
```

### TransactionModalContext

```ts
interface TransactionModalContextValue {
  openAddTransaction: (initialTab?: "income" | "expense") => void;
}
```

- `initialTab` defaults to `"expense"` when not provided
- State: `isOpen`, `initialTab`
- Same pattern as `ThemeContext` (createContext + Provider + use hook)

### GlobalTransactionModal

Reuses `ResponsiveModal` shell. Contains:

**Tab bar** — Pemasukkan / Pengeluaran pill toggle (same visual as old form)

**Income tab fields**:
| Label | Input type | Maps to DB field |
|-------|-----------|------------------|
| Jumlah (Rp) | `input[type=number]` | `amount` |
| Asal Pemasukkan | `input[type=text]` | `merchant` |
| Metode Pembayaran | `select` | `payment_method` |

- `category` → `"Pemasukkan"` (fixed)

**Expense tab fields**:
| Label | Input type | Maps to DB field |
|-------|-----------|------------------|
| Jumlah (Rp) | `input[type=number]` | `amount` |
| Tujuan Pengeluaran | `input[type=text]` | `merchant` |
| Jenis Pengeluaran | `select` | `category` |
| Metode Pembayaran | `select` | `payment_method` |

**Validation:**
- Amount required, must be > 0
- Merchant/source required, non-empty
- Error message displayed inline

**Submit:**
- Calls `addTransaction` from `useTransactions` hook
- Resets form, closes modal

### Files Changed

| File | Action |
|------|--------|
| `src/lib/transaction-modal-context.tsx` | **New** — Context + Provider |
| `src/components/shared/GlobalTransactionModal.tsx` | **New** — Modal with tabs |
| `src/components/layout/AppShell.tsx` | Wrap children with `TransactionModalProvider` |
| `src/components/layout/NavigationBar.tsx` | Import context, wire onClick |
| `src/app/dashboard/page.tsx` | Import context, wire onClick, remove local state |
| `src/app/budget/page.tsx` | Import context, wire onClick, remove local showAddForm state + import |
| `src/components/budget/AddTransactionForm.tsx` | **Delete** — replaced |

### Category List (Expense Tab)

Reuse existing from `AddTransactionForm.tsx`:
`["Makanan & Minuman", "Transportasi", "Belanja", "Hiburan", "Tagihan", "Kesehatan", "Pendidikan", "Investasi"]`

### Payment Methods

Reuse existing: `["Cash", "Transfer Bank", "Kartu Kredit", "E-Wallet"]`

## Implementation Plan

1. Create `transaction-modal-context.tsx`
2. Create `GlobalTransactionModal.tsx`
3. Update `AppShell.tsx` — wrap with provider, render modal
4. Update `NavigationBar.tsx` — wire sidebar button
5. Update `dashboard/page.tsx` — wire dashboard button
6. Update `budget/page.tsx` — wire budget button, remove old import + state
7. Delete `AddTransactionForm.tsx`
8. `npm run build` — verify
