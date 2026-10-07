"use client";

import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/netWorth";
import type { AssetEntry, LiabilityEntry } from "@/lib/netWorth";
import { useLanguage } from "@/lib/i18n";

interface TopHoldingsCardProps {
  assets: AssetEntry[];
  liabilities: LiabilityEntry[];
  assetEmptyText?: string;
  liabilityEmptyText?: string;
  viewAllHref?: string;
}

function TopList({
  title,
  items,
  emptyText,
  amountClass,
}: {
  title: string;
  items: Array<{ id: string; name: string; amount: number }>;
  emptyText: string;
  amountClass: string;
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="py-1 text-xs italic text-text-secondary/70">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-surface-alt/40 px-3 py-2"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface font-mono text-[11px] font-bold text-text-muted">
                {i + 1}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                {item.name}
              </p>
              <span className={`shrink-0 font-mono text-xs font-semibold ${amountClass}`}>
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopHoldingsCard({
  assets,
  liabilities,
  assetEmptyText,
  liabilityEmptyText,
  viewAllHref,
}: TopHoldingsCardProps) {
  const { t } = useLanguage();
  const topAssets = [...assets].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const topLiabilities = [...liabilities]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="glass min-w-0 rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <Trophy className="h-4 w-4 shrink-0 text-text-muted" />
        <h2 className="truncate text-sm font-semibold text-text-primary">
          {t("dashboard.top_holdings")}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            {t("wealth.view_all")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="grid grid-row-2 gap-5 sm:gap-4">
        <TopList
          title={t("dashboard.largest_assets")}
          items={topAssets}
          emptyText={assetEmptyText ?? t("wealth.no_assets_yet")}
          amountClass="text-success"
        />
        <TopList
          title={t("dashboard.largest_liabilities")}
          items={topLiabilities}
          emptyText={liabilityEmptyText ?? t("wealth.no_liabilities_yet")}
          amountClass="text-danger"
        />
      </div>
    </div>
  );
}
