# Dashboard Net Worth Card — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Net Worth card to the Dashboard — side-by-side with Balance card on desktop, switchable via animated card switcher on mobile.

**Architecture:** Reuse `NetWorthCard` from wealth page as-is. Create `MobileCardSwitcher` as a reusable animated container. Dashboard page loads asset/liability data from localStorage (same source as Wealth page) and computes net worth.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Lucide React

## Global Constraints

- All colors use Tailwind v4 theme tokens from `globals.css` (`bg-surface`, `text-text-primary`, `border-border`, etc.)
- Indonesian labels for user-facing text
- Data source: localStorage keys `finspace_assets` and `finspace_liabilities` (shared with Wealth page)
- Net worth computation: `calculateNetWorth()` from `@/lib/netWorth`

---

### Task 1: Create MobileCardSwitcher Component

**Files:**
- Create: `src/components/dashboard/MobileCardSwitcher.tsx`

**Interfaces:**
- Produces: `<MobileCardSwitcher views={[ReactNode, ReactNode]} />` — renders active view with 2-dot indicator and slide animation

- [ ] **Step 1: Create MobileCardSwitcher.tsx**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";

interface MobileCardSwitcherProps {
  views: [ReactNode, ReactNode];
  initialIndex?: number;
  labels?: [string, string];
}

export function MobileCardSwitcher({
  views,
  initialIndex = 0,
  labels = ["Balance", "Net Worth"],
}: MobileCardSwitcherProps) {
  const [active, setActive] = useState(initialIndex);
  const [prevActive, setPrevActive] = useState(initialIndex);
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");

  useEffect(() => {
    if (active !== prevActive) {
      setAnimating(true);
      const timer = setTimeout(() => {
        setPrevActive(active);
        setAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [active, prevActive]);

  function switchTo(index: number) {
    if (index === active || animating) return;
    setSlideDir(index > active ? "right" : "left");
    setActive(index);
  }

  const currentView = views[prevActive];
  const nextView = views[active];

  return (
    <div className="glass rounded-2xl shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30">
      {/* ── Dot indicators ── */}
      <div className="flex items-center justify-end gap-2 px-6 pt-4">
        {views.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => switchTo(i)}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              i === active
                ? "bg-primary w-5"
                : "bg-border hover:bg-text-muted"
            }`}
            aria-label={labels[i]}
          />
        ))}
      </div>

      {/* ── Animated card slot ── */}
      <div className="relative overflow-hidden px-6 pb-6" style={{ minHeight: 200 }}>
        {/* Current (outgoing) */}
        <div
          className="w-full transition-transform duration-300 ease-in-out"
          style={{
            transform:
              animating
                ? `translateX(${slideDir === "right" ? "-100%" : "100%"})`
                : "translateX(0)",
          }}
        >
          {currentView}
        </div>

        {/* Next (incoming) — positioned over current */}
        {animating && (
          <div
            className="absolute inset-x-6 top-0 w-[calc(100%-3rem)] transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(${slideDir === "right" ? "0" : "0"})`,
            }}
          >
            {nextView}
          </div>
        )}
      </div>
    </div>
  );
}
```

Wait — this animation approach won't work well because both views need to animate at the same time. Let me use a better approach: both views are always rendered, absolutely positioned, and we translate them together.

Actually, the simplest reliable approach:

```tsx
"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface MobileCardSwitcherProps {
  views: [ReactNode, ReactNode];
  initialIndex?: number;
  labels?: [string, string];
}

export function MobileCardSwitcher({
  views,
  initialIndex = 0,
  labels = ["Balance", "Net Worth"],
}: MobileCardSwitcherProps) {
  const [active, setActive] = useState(initialIndex);

  function switchTo(index: number) {
    if (index === active) return;
    setActive(index);
  }

  return (
    <div className="glass rounded-2xl shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30">
      {/* ── Dot indicators ── */}
      <div className="flex items-center justify-end gap-2 px-6 pt-4">
        {views.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => switchTo(i)}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              i === active
                ? "bg-primary w-5"
                : "bg-border hover:bg-text-muted"
            }`}
            aria-label={labels[i]}
          />
        ))}
      </div>

      {/* ── Animated card slot ── */}
      <div className="relative overflow-hidden px-6 pb-6">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {views.map((view, i) => (
            <div key={i} className="w-full shrink-0">
              {view}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

This uses a flex container with 300ms translateX animation. Both views sit side-by-side in the flex row, and we translate the container. This is the standard "carousel" approach and works perfectly.

- [ ] **Step 2: Verify the component**

The component is self-contained — it only needs React. No test needed for a pure presentational component at this stage.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/MobileCardSwitcher.tsx
git commit -m "feat: add MobileCardSwitcher with slide animation"
```

---

### Task 2: Update Dashboard Page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `NetWorthCard` from `@/components/wealth/NetWorthCard`, `MobileCardSwitcher` from `@/components/dashboard/MobileCardSwitcher`, `calculateNetWorth` from `@/lib/netWorth`
- Produces: Updated Dashboard with net worth card

- [ ] **Step 1: Update imports in page.tsx**

Add these imports:

```tsx
import { NetWorthCard } from "@/components/wealth/NetWorthCard";
import { MobileCardSwitcher } from "@/components/dashboard/MobileCardSwitcher";
import { NetWorthResult, calculateNetWorth } from "@/lib/netWorth";
import type { AssetEntry, LiabilityEntry } from "@/lib/netWorth";
```

- [ ] **Step 2: Add state for assets & liabilities**

After the existing `liquidAssets` useState block, add:

```tsx
const [netWorthData, setNetWorthData] = useState<NetWorthResult>({
  totalAssets: 0,
  totalLiabilities: 0,
  netWorth: 0,
  liquidAssets: 0,
});
```

Then expand the existing `useEffect` for localStorage to also load full asset/liability data:

```tsx
/* ── Share data with Wealth page via localStorage ── */
const [liquidAssets, setLiquidAssets] = useState(0);
const [netWorthData, setNetWorthData] = useState<NetWorthResult>({
  totalAssets: 0,
  totalLiabilities: 0,
  netWorth: 0,
  liquidAssets: 0,
});

useEffect(() => {
  if (typeof window !== "undefined") {
    try {
      const rawAssets = localStorage.getItem("finspace_assets");
      const rawLiabilities = localStorage.getItem("finspace_liabilities");

      const assets: AssetEntry[] = rawAssets ? JSON.parse(rawAssets) : [];
      const liabilities: LiabilityEntry[] = rawLiabilities ? JSON.parse(rawLiabilities) : [];

      const cash = assets
        .filter((a) => a.type === "liquid")
        .reduce((sum, a) => sum + a.amount, 0);
      setLiquidAssets(cash);

      setNetWorthData(calculateNetWorth(assets, liabilities));
    } catch {
      // ignore parse errors
    }
  }
}, []);
```

Replace the existing `liquidAssets` useEffect block with this expanded version.

- [ ] **Step 3: Replace the mobile card section**

Replace the mobile combined balance card (the `lg:hidden` section, lines 223-263) with:

```tsx
      {/* ── Mobile: Switchable Balance / Net Worth card ── */}
      <div className="lg:hidden">
        <MobileCardSwitcher
          views={[
            /* Balance View */
            <div key="balance" className="pt-2">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                Total Balance
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <p className="font-mono text-3xl font-bold text-text-primary">
                  {formatCurrency(Math.abs(balance))}
                </p>
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isPositive
                      ? "bg-success/15 text-success"
                      : "bg-danger/15 text-danger"
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  )}
                  {isPositive ? "Positif" : "Negatif"}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="font-mono text-xs text-text-muted">Income</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-success">
                    {formatCurrency(income)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs text-text-muted">Expenses</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-danger">
                    {formatCurrency(expenses)}
                  </p>
                </div>
              </div>
            </div>,

            /* Net Worth View */
            <div key="networth" className="pt-2">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                Net Worth
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <p className="font-mono text-3xl font-bold text-text-primary">
                  {formatCurrency(Math.abs(netWorthData.netWorth))}
                </p>
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    netWorthData.netWorth >= 0
                      ? "bg-success/15 text-success"
                      : "bg-danger/15 text-danger"
                  }`}
                >
                  {netWorthData.netWorth >= 0 ? (
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  )}
                  {netWorthData.netWorth >= 0 ? "Positif" : "Negatif"}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="font-mono text-xs text-text-muted">Total Aset</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-success">
                    {formatCurrency(netWorthData.totalAssets)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs text-text-muted">Total Liabilitas</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-danger">
                    {formatCurrency(netWorthData.totalLiabilities)}
                  </p>
                </div>
              </div>
            </div>,
          ]}
        />
      </div>
```

- [ ] **Step 4: Replace the desktop cards section**

Replace the desktop 3 separate cards (the `hidden lg:grid lg:grid-cols-3` section, lines 265-308) with a 2-column grid showing the combined Balance card + NetWorthCard:

```tsx
      {/* ── Desktop: 2-column grid — Balance + Net Worth ── */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-2">
        {/* Combined Balance + Income/Expense */}
        <div className="glass rounded-2xl p-6 shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            Total Balance
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <p className="font-mono text-3xl font-bold text-text-primary">
              {formatCurrency(Math.abs(balance))}
            </p>
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isPositive
                  ? "bg-success/15 text-success"
                  : "bg-danger/15 text-danger"
              }`}
            >
              {isPositive ? (
                <ArrowUpIcon className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownIcon className="h-3.5 w-3.5" />
              )}
              {isPositive ? "Positif" : "Negatif"}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <p className="font-mono text-xs text-text-muted">Income</p>
              <p className="mt-1 font-mono text-lg font-semibold text-success">
                {formatCurrency(income)}
              </p>
            </div>
            <div>
              <p className="font-mono text-xs text-text-muted">Expenses</p>
              <p className="mt-1 font-mono text-lg font-semibold text-danger">
                {formatCurrency(expenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Net Worth Card */}
        <NetWorthCard data={netWorthData} />
      </div>
```

- [ ] **Step 5: Build verification**

```bash
npm run build
```

Expected: Compiled successfully, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add net worth card to dashboard"
```
