"use client";

import { useState, useRef, useCallback } from "react";
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
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const isDraggingRef = useRef(false);
  /** Ref to track if touch started on interactive element (button, link, etc.) */
  const touchOnInteractive = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  function switchTo(index: number) {
    if (index === active) return;
    setActive(index);
  }

  /** Check if element or its ancestor is interactive */
  function isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest(
      "button, a, input, select, textarea, [role=button], [role=tab]"
    );
  }

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Jangan intercept sentuhan yang dimulai di elemen interaktif (tombol, link)
    if (isInteractiveTarget(e.target)) {
      touchOnInteractive.current = true;
      return;
    }
    touchOnInteractive.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    touchDeltaX.current = dx;

    // Axis lock: ignore jika gesture lebih vertikal (scroll)
    if (Math.abs(dx) < dy * 1.5 && Math.abs(dx) > 10) return;

    // Edge clamp: jangan geser visual di batas
    if (
      (active === 0 && dx > 0) ||
      (active === views.length - 1 && dx < 0)
    )
      return;

    if (carouselRef.current) {
      const offset =
        -active * 100 + (dx / carouselRef.current.offsetWidth) * 80;
      carouselRef.current.style.transform = `translateX(${offset}%)`;
    }
  }, [active, views.length]);

  const onTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);

    // Skip jika sentuhan di elemen interaktif (tombol, link, dll)
    // Jangan reset transform — biarkan React handle via style binding
    if (touchOnInteractive.current) return;

    // Reset transform inline agar transition class bekerja pada posisi benar
    if (carouselRef.current) {
      carouselRef.current.style.transform = "";
    }

    const threshold = 50;
    const dx = touchDeltaX.current;

    if (dx < -threshold && active < views.length - 1) {
      setActive((p) => p + 1);
    } else if (dx > threshold && active > 0) {
      setActive((p) => p - 1);
    }
  }, [active, views.length]);

  return (
    <div className="flex flex-col gap-2">
      {/* ── Animated card slot with swipe ── */}
      <div
        className="relative overflow-hidden w-full rounded-2xl shadow-lg shadow-black/20 backdrop-blur-xl cursor-grab active:cursor-grabbing select-none touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={carouselRef}
          className={`flex ${
            isDragging ? "" : "transition-transform duration-300 ease-in-out"
          }`}
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {views.map((view, i) => (
            <div key={i} className="w-full shrink-0">
              {view}
            </div>
          ))}
        </div>
      </div>

      {/* ── Card selector dots ── */}
      <div className="flex items-center justify-center gap-2 px-1 pt-2">
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
    </div>
  );
}
