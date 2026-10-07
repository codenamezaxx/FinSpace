"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Wallet, CreditCard } from "lucide-react";
import { db } from "@/lib/db";
import { useWealthData } from "@/hooks/useWealthData";
import { usePockets } from "@/hooks/usePockets";
import { useTransactions } from "@/hooks/useTransactions";
import { useAssetLiabilityModal } from "@/lib/asset-liability-modal-context";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { AssetRow, LiabilityRow } from "@/components/wealth/WealthLists";
import { calculateNetWorth, formatCurrency } from "@/lib/netWorth";
import type { AssetEntry, LiabilityEntry } from "@/lib/netWorth";
import { useLanguage } from "@/lib/i18n";

export default function WealthAssetsPage() {
  const { t } = useLanguage();
  const { assets, liabilities } = useWealthData();
  const { pockets, totalBalance: pocketTotalBalance } = usePockets();
  const { addTransaction } = useTransactions();
  const { openAssetLiabilityModal } = useAssetLiabilityModal();

  const [assetToDelete, setAssetToDelete] = useState<AssetEntry | null>(null);
  const [liabilityToDelete, setLiabilityToDelete] =
    useState<LiabilityEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const assetPager = usePagination(assets.length, 15, assets.length);
  const liabilityPager = usePagination(liabilities.length, 15, liabilities.length);
  const pagedAssets = assets.slice(
    (assetPager.page - 1) * assetPager.pageSize,
    assetPager.page * assetPager.pageSize
  );
  const pagedLiabilities = liabilities.slice(
    (liabilityPager.page - 1) * liabilityPager.pageSize,
    liabilityPager.page * liabilityPager.pageSize
  );

  const totalAssets = calculateNetWorth(assets, liabilities, pocketTotalBalance, []).totalAssets;
  const totalLiabilities = calculateNetWorth(assets, liabilities, pocketTotalBalance, []).totalLiabilities;

  const handlePurchase = useCallback(
    (data: { name: string; amount: number; pocketId?: string }) => {
      const pocket =
        pockets.find((p) => p.id === data.pocketId) ??
        pockets.find((p) => p.name === "Tunai");
      addTransaction({
        amount: data.amount,
        type: "expense",
        category: "Pembelian",
        merchant: `Pembelian: ${data.name}`,
        payment_method: pocket?.name ?? "Tunai",
        pocketId: pocket?.id ?? null,
      });
    },
    [addTransaction, pockets]
  );

  const openAddItem = useCallback(
    (defaultType: "asset" | "liability") => {
      openAssetLiabilityModal({
        defaultType,
        onPurchase: handlePurchase,
        currentBalance: pocketTotalBalance,
      });
    },
    [openAssetLiabilityModal, handlePurchase, pocketTotalBalance]
  );

  const handleConfirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    setDeleting(true);
    try {
      await db.assets.delete(assetToDelete.id);
      setAssetToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDeleteLiability = async () => {
    if (!liabilityToDelete) return;
    setDeleting(true);
    try {
      await db.liabilities.delete(liabilityToDelete.id);
      setLiabilityToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 lg:px-4">
      <Link
        href="/wealth"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("settings.back")}
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-text-primary">
            {t("wealth.assets_page_title")}
          </h1>
          <p className="mt-2 font-mono text-xs text-text-muted">
            {assets.length} · {formatCurrency(totalAssets)}
            {" | "}
            {liabilities.length} · {formatCurrency(totalLiabilities)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAddItem("asset")}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          {t("wealth.add_item")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assets */}
        <div>
          <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("wealth.total_assets")}
          </h3>
          <div className="space-y-2">
            <div className="glass flex items-center justify-between rounded-xl border-l-4 border-l-primary p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {t("wealth.recorded_balance")}
                </p>
                <p className="font-mono text-xs text-text-muted">
                  {t("wealth.auto_from_transactions")}
                </p>
              </div>
              <span className="shrink-0 font-mono text-sm font-semibold text-success">
                {formatCurrency(pocketTotalBalance)}
              </span>
            </div>
            {assets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <Wallet className="mx-auto h-8 w-8 text-text-muted" />
                <p className="mt-2 font-mono text-sm italic text-text-secondary/70">
                  {t("wealth.no_assets_yet")}
                </p>
                <button
                  type="button"
                  onClick={() => openAddItem("asset")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/20 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  {t("wealth.add_item")}
                </button>
              </div>
            ) : (
              pagedAssets.map((asset) => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  onEdit={() => openAssetLiabilityModal({ editItem: asset })}
                  onDelete={() => setAssetToDelete(asset)}
                />
              ))
            )}
            <PaginationControls
              page={assetPager.page}
              totalPages={assetPager.totalPages}
              onPrev={assetPager.prev}
              onNext={assetPager.next}
              pageSize={assetPager.pageSize}
              onPageSizeChange={assetPager.setPageSize}
            />
          </div>
        </div>

        {/* Liabilities */}
        <div>
          <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("wealth.total_liabilities")}
          </h3>
          {liabilities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-text-muted" />
              <p className="mt-2 font-mono text-sm italic text-text-secondary/70">
                {t("wealth.no_liabilities_yet")}
              </p>
              <button
                type="button"
                onClick={() => openAddItem("liability")}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/20 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                {t("wealth.add_item")}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {pagedLiabilities.map((liability) => (
                <LiabilityRow
                  key={liability.id}
                  liability={liability}
                  onEdit={() => openAssetLiabilityModal({ editItem: liability })}
                  onDelete={() => setLiabilityToDelete(liability)}
                />
              ))}
              <PaginationControls
                page={liabilityPager.page}
                totalPages={liabilityPager.totalPages}
                onPrev={liabilityPager.prev}
                onNext={liabilityPager.next}
                pageSize={liabilityPager.pageSize}
                onPageSizeChange={liabilityPager.setPageSize}
              />
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
        onConfirm={handleConfirmDeleteAsset}
        title={t("confirm.delete_asset")}
        message={t("confirm.delete_message", { item: assetToDelete?.name ?? "" })}
        confirmLabel={t("confirm.confirm")}
        isLoading={deleting}
      />
      <ConfirmModal
        isOpen={!!liabilityToDelete}
        onClose={() => setLiabilityToDelete(null)}
        onConfirm={handleConfirmDeleteLiability}
        title={t("confirm.delete_liability")}
        message={t("confirm.delete_message", { item: liabilityToDelete?.name ?? "" })}
        confirmLabel={t("confirm.confirm")}
        isLoading={deleting}
      />
    </div>
  );
}
