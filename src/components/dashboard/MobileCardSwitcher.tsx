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
