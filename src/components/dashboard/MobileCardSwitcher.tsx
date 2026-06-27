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
  labels = ["Saldo", "Kekayaan Bersih"],
}: MobileCardSwitcherProps) {
  const [active, setActive] = useState(initialIndex);

  function switchTo(index: number) {
    if (index === active) return;
    setActive(index);
  }

  return (
    <div className="space-y-2">
      {/* ── Card selector dots ── */}
      <div className="flex items-center justify-end gap-2 px-1">
        {views.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => switchTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active
                ? "w-5 bg-primary"
                : "w-2 bg-border hover:bg-text-muted"
            }`}
            aria-label={labels[i]}
          />
        ))}
      </div>

      {/* ── Animated card slot ── */}
      <div className="relative overflow-hidden w-full h-54">
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
