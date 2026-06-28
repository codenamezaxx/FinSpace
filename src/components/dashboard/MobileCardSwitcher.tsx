"use client";

import { useState, useEffect, useRef } from "react";
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
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track height changes via ResizeObserver for smooth animation
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
      <div
        className="relative overflow-hidden w-full transition-[height] duration-300 ease-in-out"
        style={{ height: containerHeight ? `${containerHeight}px` : undefined }}
      >
        <div
          ref={contentRef}
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
