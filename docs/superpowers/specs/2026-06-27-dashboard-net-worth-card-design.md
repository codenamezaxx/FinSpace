# Dashboard — Net Worth Card

## Problem
Net worth information hanya tersedia di halaman Wealth, padahal pengguna ingin melihat ringkasan kekayaan bersih langsung di Dashboard.

## Persyaratan

1. **Desktop (lg+):** Gabungkan Total Balance + Income + Expense kembali menjadi **1 kartu utama** (seperti sebelumnya). Di sebelah kanannya, tambahkan **Net Worth card** yang menampilkan net worth, total aset, dan total liabilitas (sama persis dengan yang ada di halaman Wealth).

2. **Mobile:** Kartu utama (Total Balance) diberikan **tombol switch** berupa 2 indikator titik (dot). Tap titik akan **men-switch** antara tampilan Balance dan tampilan Net Worth di posisi kartu yang sama. Animasi switch: kartu baru **slide dari kanan menutupi** kartu lama (efek deck kartu).

---

## Tata Letak

### Desktop (≥1024px)
```
┌───────────────────────────┬───────────────────────────┐
│  Total Balance            │  Net Worth                │
│  Rp 5.000.000             │  Rp 50.000.000            │
│  Positif                  │  Positive                 │
│                           │                           │
│  Income     │  Expense    │  Total Assets │ Liabilities│
│  Rp 8jt     │  Rp 3jt     │  Rp 100jt     │ Rp 50jt    │
└───────────────────────────┴───────────────────────────┘

    1 kartu gabungan             1 kartu Net Worth
    (Balance + Income/Expense)    (dgn Aset & Liabilitas)
```

2 kartu dalam grid `lg:grid-cols-2` dengan gap yang sama.

### Mobile (<1024px)
```
┌─────────────────────────────────────┐
│                         ● ○          │  ← 2 dot indicator
│                                     │
│  [Balance View] ←switch→ [Net Worth]│  ← slide horizontal
│                                     │
│  Income    Expense  /  Aset  Liab    │
│  Rp 8jt    Rp 3jt   /  Rp 100jt Rp50│
└─────────────────────────────────────┘
```

- 1 card slot dengan `overflow: hidden`
- 2 view di dalamnya: BalanceView dan NetWorthView
- Transisi: `translateX` CSS dengan `transition-duration: 300ms`

---

## Animasi Switch (Mobile)

**Mekanisme:**
- BalanceView dan NetWorthView di-render bersamaan dalam container `relative overflow-hidden`
- Keduanya punya `position: absolute` dan `width: 100%`
- BalanceView di `translateX(0)`, NetWorthView di `translateX(100%)` (default)
- Saat switch ke Net Worth: BalanceView → `translateX(-100%)`, NetWorthView → `translateX(0)`
- Saat switch ke Balance: sebaliknya
- Ditambah `transition: transform 300ms ease-in-out`

Efek: kartu baru muncul dari kanan mendorong kartu lama ke kiri (seperti mengambil kartu dari belakang tumpukan).

---

## Data Flow

1. Dashboard membaca data aset & liabilitas dari localStorage dengan key yang sama dengan halaman Wealth:
   - `finspace_assets` → array `AssetEntry[]`
   - `finspace_liabilities` → array `LiabilityEntry[]`
2. Data di-load via `useEffect` + `useState` (sama seperti Wealth page).
3. Net worth dihitung dengan `calculateNetWorth(assets, liabilities)` dari `lib/netWorth.ts`.
4. `NetWorthCard` yang sudah ada di `components/wealth/NetWorthCard.tsx` bisa di-reuse langsung.

---

## Component Changes

| File | Perubahan |
|---|---|
| `src/app/dashboard/page.tsx` | Load assets & liabilities dari localStorage; komputasi `netWorthData`; render `NetWorthCard` berdampingan dengan balance card di desktop; render `MobileCardSwitcher` di mobile |
| `src/components/dashboard/MobileCardSwitcher.tsx` | **Baru.** Container dengan 2 dot indicator + 2 absolute-positioned views + slide animation. Props: `balanceView` (ReactNode), `netWorthView` (ReactNode), `initialView` |
| `src/components/wealth/NetWorthCard.tsx` | Tidak perlu diubah — sudah sesuai dan bisa di-reuse langsung |

---

## Skema File Baru

```
src/components/dashboard/
└── MobileCardSwitcher.tsx    (baru)
```

Tidak ada file baru lain. `NetWorthCard` sudah ada dan siap pakai.

---

## Yang Tidak Berubah

- SmartInsights, TransactionHistory, HealthScoreRing — tidak tersentuh
- Halaman Wealth — tidak tersentuh
- Quick Actions — tetap di bawah kedua kartu
- Bottom section (SmartInsights + TransactionHistory) — tetap `lg:grid-cols-2`
