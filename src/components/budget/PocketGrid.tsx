"use client";

import { Plus } from "lucide-react";
import { PocketCard } from "./PocketCard";
import type { Pocket } from "@/lib/pocket";
import { useLanguage } from "@/lib/i18n";

interface PocketGridProps {
  pockets: Pocket[];
  balances: Record<string, number>;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onRename: (pocket: Pocket) => void;
  onDelete: (pocket: Pocket) => void;
  onTransfer: (pocket?: Pocket) => void;
}

export function PocketGrid({
  pockets, balances, onSelect, onAdd, onRename, onDelete, onTransfer,
}: PocketGridProps) {
  const { t } = useLanguage();
  if (pockets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <button
          type="button"
          onClick={onAdd}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-6 text-text-muted transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-semibold">{t("pockets.create_first")}</span>
        </button>
        <p className="text-xs text-text-muted">{t("pockets.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {pockets.map((pocket) => (
          <PocketCard
            key={pocket.id}
            pocket={pocket}
            balance={balances[pocket.id] ?? 0}
            onClick={() => onSelect(pocket.id)}
            onRename={() => onRename(pocket)}
            onDelete={() => onDelete(pocket)}
            onTransfer={() => onTransfer(pocket)}
          />
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-text-muted transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5"
        >
          <Plus className="h-6 w-6" />
          <span className="text-xs font-semibold">{t("pockets.add_pocket")}</span>
        </button>
      </div>
    </div>
  );
}
