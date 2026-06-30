"use client";

import { Wallet, CreditCard, Landmark, MoreHorizontal, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import type { Pocket } from "@/lib/pocket";
import { formatCurrency } from "@/lib/netWorth";
import { useState, useRef, useEffect } from "react";

interface PocketCardProps {
  pocket: Pocket;
  balance: number;
  isSelected: boolean;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  onTransfer: () => void;
}

const CATEGORY_CONFIG: Record<Pocket["category"], { icon: typeof Wallet; tint: string; bg: string }> = {
  tunai: { icon: Wallet, tint: "text-accent", bg: "bg-accent/10" },
  ewallet: { icon: CreditCard, tint: "text-primary", bg: "bg-primary/10" },
  rekening: { icon: Landmark, tint: "text-accent-secondary", bg: "bg-accent-secondary/10" },
};

export function PocketCard({ pocket, balance, isSelected, onClick, onRename, onDelete, onTransfer }: PocketCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const config = CATEGORY_CONFIG[pocket.category];
  const Icon = config.icon;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className={`relative flex shrink-0 flex-col items-start gap-1.5 rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 w-36 ${
        isSelected ? "ring-2 ring-primary bg-surface" : "bg-surface/80"
      }`}
    >
      {/* ⋮ menu */}
      <div className="absolute right-1.5 top-1.5" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-border bg-surface p-1 shadow-xl shadow-black/30">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Ganti Nama
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onTransfer(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
            >
              <ArrowRightLeft className="h-3 w-3" />
              Pindah Saldo
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Hapus
            </button>
          </div>
        )}
      </div>

      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${config.bg}`}>
        <Icon className={`h-4 w-4 ${config.tint}`} />
      </div>
      <p className="text-xs font-semibold text-text-primary truncate w-full pr-4">{pocket.name}</p>
      <p className="font-mono text-sm font-bold text-text-primary">{formatCurrency(balance)}</p>
    </div>
  );
}
