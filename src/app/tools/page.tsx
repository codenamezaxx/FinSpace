import Link from "next/link";
import { Cloud, Settings } from "lucide-react";
import { LoanCalculator } from "@/components/tools/LoanCalculator";
import { SavingsGoal } from "@/components/tools/SavingsGoal";
import { ExportCSV } from "@/components/tools/ExportCSV";
import ReceiptGenerator from "@/components/tools/ReceiptGenerator";

export default function ToolsPage() {
  return (
    <div className="space-y-6 lg:px-4">
      <h1 className="text-2xl font-bold text-text-primary">Alat</h1>
      <p className="font-mono mt-1 text-text-muted">
        Kalkulator, tabungan, dan ekspor data keuangan Anda.
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

      {/* Sinkronisasi Cloud */}
      <Link
        href="/settings"
        className="glass group rounded-2xl p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-[0_0_24px_#3B82F633]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Cloud className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
              Sinkronisasi Cloud
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Kelola akun, status sinkronisasi, dan pengaturan cloud
            </p>
          </div>
          <Settings className="h-4 w-4 text-text-muted transition-colors group-hover:text-primary" />
        </div>
      </Link>
    </div>
  );
}
