"use client";

import Link from "next/link";
import { Cloud, Settings } from "lucide-react";
import { LoanCalculator } from "@/components/tools/LoanCalculator";
import { SavingsGoal } from "@/components/tools/SavingsGoal";
import { ExportCSV } from "@/components/tools/ExportCSV";
import ReceiptGenerator from "@/components/tools/ReceiptGenerator";
import { useLanguage } from "@/lib/i18n";

export default function ToolsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6 lg:px-4">
      <h1 className="text-2xl font-bold text-text-primary">{t("tools.title")}</h1>
      <p className="text-sm text-text-muted">
        {t("tools.description")}
      </p>

      {/* Kalkulator + Tabungan */}
      <div className="grid gap-6 md:grid-cols-2">
        <LoanCalculator />
        <SavingsGoal />
      </div>

      {/* Struk + Ekspor CSV */}
      <div className="grid gap-6 md:grid-cols-2">
        <ReceiptGenerator />
        <ExportCSV />
      </div>
    </div>
  );
}
