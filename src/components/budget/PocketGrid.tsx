"use client";

import { Plus } from "lucide-react";
import { PocketCard } from "./PocketCard";
import type { Pocket } from "@/lib/pocket";

interface PocketGridProps {
  pockets: Pocket[];
  balances: Record<string, number>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onRename: (pocket: Pocket) => void;
  onDelete: (pocket: Pocket) => void;
}

export function PocketGrid({
  pockets, balances, selectedId, onSelect, onAdd, onRename, onDelete,
}: PocketGridProps) {
  if (pockets.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none md:flex-wrap md:overflow-visible">
        {pockets.map((pocket) => (
          <PocketCard
            key={pocket.id}
            pocket={pocket}
            balance={balances[pocket.id] ?? 0}
            isSelected={selectedId === pocket.id}
            onClick={() => onSelect(selectedId === pocket.id ? null : pocket.id)}
            onRename={() => onRename(pocket)}
            onDelete={() => onDelete(pocket)}
          />
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="flex shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-text-muted transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5 w-36"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-semibold">Tambah Kantong</span>
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            selectedId === null
              ? "bg-primary text-white"
              : "border border-border text-text-muted hover:bg-surface-alt hover:text-text-secondary"
          }`}
        >
          Semua Kantong
        </button>
        {selectedId && (
          <span className="self-center text-[11px] text-text-muted">
            Menampilkan transaksi kantong terpilih
          </span>
        )}
      </div>
    </div>
  );
}
