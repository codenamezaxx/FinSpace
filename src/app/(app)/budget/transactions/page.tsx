"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { TransactionList } from "@/components/shared/TransactionList";
import { usePockets } from "@/hooks/usePockets";

function BudgetTransactionsInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const { pockets } = usePockets();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || undefined;
  const pocketId = searchParams.get("pocket") || undefined;
  const openTxId = searchParams.get("tx") || undefined;
  const pocketName = pockets.find((p) => p.id === pocketId)?.name;

  return (
    <div className="space-y-6 lg:px-4">
      <Link
        href="/budget"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("settings.back")}
      </Link>

      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold text-text-primary">
          {t("budget.transactions_title")}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {t("budget.recent_transactions")}
        </p>
      </div>

      {pocketId && (
        <button
          type="button"
          onClick={() => router.push("/budget/transactions")}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          {pocketName ?? pocketId}
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <TransactionList
        pocketFilter={pocketId ?? null}
        pockets={pockets}
        searchQuery={searchQuery}
        openTxId={openTxId}
      />
    </div>
  );
}

export default function BudgetTransactionsPage() {
  return (
    <Suspense fallback={null}>
      <BudgetTransactionsInner />
    </Suspense>
  );
}
