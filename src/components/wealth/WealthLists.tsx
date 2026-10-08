"use client";

import { useEffect, useRef } from "react";
import { Pencil, Trash2, Wallet, TrendingUp, Landmark, Package } from "lucide-react";
import { formatCurrency } from "@/lib/netWorth";
import type { AssetEntry, LiabilityEntry } from "@/lib/netWorth";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export const ASSET_META: Record<AssetEntry["type"], { icon: LucideIcon; tint: string; labelKey: string }> = {
  liquid: { icon: Wallet, tint: "text-primary bg-primary/10", labelKey: "wealth.liquid" },
  investment: { icon: TrendingUp, tint: "text-success bg-success/10", labelKey: "wealth.investment" },
  property: { icon: Landmark, tint: "text-accent-secondary bg-accent-secondary/10", labelKey: "wealth.property" },
  other: { icon: Package, tint: "text-text-muted bg-surface-alt", labelKey: "wealth.other" },
};

const iconBtn =
  "shrink-0 p-1 transition-colors duration-200";

export function AssetRow({
  asset,
  onEdit,
  onDelete,
  highlighted = false,
}: {
  asset: AssetEntry;
  onEdit?: () => void;
  onDelete?: () => void;
  highlighted?: boolean;
}) {
  const { t } = useLanguage();
  const meta = ASSET_META[asset.type] ?? ASSET_META.other;
  const Icon = meta.icon;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [highlighted]);
  return (
    <div
      ref={ref}
      className={`glass flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20 ${
        highlighted ? "ring-2 ring-primary" : ""
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {asset.name}
        </p>
        <p className="font-mono text-xs text-text-muted">
          {t(meta.labelKey)}
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm font-semibold text-text-primary">
        {formatCurrency(asset.amount)}
      </span>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={`${iconBtn} text-text-muted hover:text-primary`}
          aria-label={t("wealth.edit_asset")}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`${iconBtn} text-text-muted hover:text-danger`}
          aria-label={t("confirm.delete_asset")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function LiabilityRow({
  liability,
  onEdit,
  onDelete,
  highlighted = false,
}: {
  liability: LiabilityEntry;
  onEdit?: () => void;
  onDelete?: () => void;
  highlighted?: boolean;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [highlighted]);
  return (
    <div
      ref={ref}
      className={`glass flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20 ${
        highlighted ? "ring-2 ring-primary" : ""
      }`}
    >
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
        {liability.name}
      </p>
      <span className="shrink-0 font-mono text-sm font-semibold text-text-primary">
        {formatCurrency(liability.amount)}
      </span>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={`${iconBtn} text-text-muted hover:text-primary`}
          aria-label={t("wealth.edit_liability")}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`${iconBtn} text-text-muted hover:text-danger`}
          aria-label={t("confirm.delete_liability")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
