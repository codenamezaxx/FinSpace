"use client";

import Image from "next/image";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Eye,
  LayoutDashboard,
  Search,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const pockets = [
  { name: "mock_pocket_cash", amount: "mock_pocket_cash_amount" },
  { name: "mock_pocket_savings", amount: "mock_pocket_savings_amount" },
  { name: "mock_pocket_wallet", amount: "mock_pocket_wallet_amount" },
] as const;

const weekDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function LandingDashboardPreview() {
  const { t } = useLanguage();

  return (
    <div
      className="overflow-hidden rounded-[18px] border border-border bg-surface shadow-pop"
      aria-label={t("landing.preview_label")}
    >
      <div className="flex h-11 items-center justify-between border-b border-border bg-surface-alt/70 px-4 sm:px-5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-[11px] font-medium text-text-muted">
          FinSpace — {t("dashboard.title")}
        </span>
        <span className="w-10" aria-hidden="true" />
      </div>

      <div className="flex">
        <aside className="hidden w-[22%] shrink-0 border-r border-border bg-surface-alt/40 p-3 lg:block">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Image src="/icons/icon-192x192.svg" alt="" width={24} height={24} className="h-6 w-6" />
            <span className="text-[11px] font-bold text-text-primary">FinSpace</span>
          </div>
          <div className="mt-4 space-y-1">
            {[
              { icon: LayoutDashboard, label: "dashboard.title", active: true },
              { icon: Wallet, label: "nav.budget", active: false },
              { icon: TrendingUp, label: "nav.wealth", active: false },
              { icon: Wrench, label: "nav.tools", active: false },
              { icon: Bot, label: "ai.chat_title", active: false },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[10px] font-medium ${
                  active ? "bg-primary/10 text-primary" : "text-text-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t(label)}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex h-10 items-center justify-between border-b border-border px-3 sm:px-4">
            <div className="flex h-6 w-1/2 max-w-48 items-center gap-1.5 rounded-md bg-surface-alt px-2 text-[9px] text-text-muted">
              <Search className="h-3 w-3 shrink-0" />
              <span className="truncate">{t("landing.preview_search")}</span>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <Eye className="h-3.5 w-3.5" />
              <span className="h-4 w-4 rounded-full border border-border bg-primary/10" />
            </div>
          </div>

          <div className="bg-background/30 p-3 sm:p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-text-primary sm:text-base">
                  {t("landing.preview_greeting")}
                </p>
                <p className="mt-0.5 text-[9px] text-text-muted sm:text-[10px]">
                  {t("dashboard.summary")}
                </p>
              </div>
              <span className="pt-1 font-mono text-[9px] text-text-muted">
                {t("landing.preview_month")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <SummaryCard
                label={t("dashboard.total_balance")}
                amount={t("landing.mock_balance_amount")}
                income={t("landing.mock_income_amount")}
                expense={t("landing.mock_expense_amount")}
                incomeLabel={t("dashboard.income")}
                expenseLabel={t("dashboard.expense")}
                accent
              />
              <div className="rounded-xl border border-border bg-surface p-3 sm:p-3.5">
                <p className="font-mono text-[8px] font-semibold uppercase tracking-wider text-text-muted">
                  {t("wealth.net_worth")}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <p className="font-mono text-base font-bold text-text-primary sm:text-lg">
                    {t("landing.mock_net_worth_amount")}
                  </p>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-[8px] font-semibold text-success">
                    <ArrowUpRight className="h-2.5 w-2.5" />
                    {t("landing.mock_net_worth_change")}
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1 border-t border-border pt-2 text-center">
                  {["preview_assets", "preview_liabilities", "preview_debts"].map((key, index) => (
                    <div key={key} className="min-w-0">
                      <p className="font-mono text-[10px] font-bold text-text-primary">{[3, 1, 2][index]}</p>
                      <p className="truncate text-[7px] text-text-muted">{t(`landing.${key}`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <section className="mt-2.5 rounded-xl border border-border bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[9px] font-semibold text-text-primary sm:text-[10px]">
                  {t("dashboard.top_pockets")}
                </h3>
                <span className="inline-flex items-center gap-1 text-[8px] font-medium text-primary">
                  {t("dashboard.see_all")} <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {pockets.map((pocket) => (
                  <div key={pocket.name} className="rounded-lg bg-surface-alt/70 px-2 py-2 text-center">
                    <p className="truncate text-[8px] text-text-secondary">{t(`landing.${pocket.name}`)}</p>
                    <p className="mt-0.5 truncate font-mono text-[9px] font-semibold text-text-primary">
                      {t(`landing.${pocket.amount}`)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-surface p-2">
              {["new_transaction", "add_asset_liability", "chat_finny"].map((key, index) => (
                <div
                  key={key}
                  className={`flex min-h-7 items-center justify-center gap-1 rounded-md px-1 text-center text-[7px] font-semibold sm:text-[8px] ${
                    index === 0 ? "bg-primary text-on-primary" : "bg-primary/5 text-primary"
                  }`}
                >
                  {t(`dashboard.${key}`)}
                </div>
              ))}
            </div>

            <section className="mt-2.5 rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[9px] font-semibold text-text-primary sm:text-[10px]">
                  {t("dashboard.cash_flow")}
                </h3>
                <div className="flex gap-1">
                  {["range_day", "range_week", "range_month", "range_year"].map((key, index) => (
                    <span
                      key={key}
                      className={`rounded px-1.5 py-0.5 text-[7px] ${
                        index === 0 ? "bg-primary/10 text-primary" : "text-text-muted"
                      }`}
                    >
                      {t(`dashboard.${key}`)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[7px] text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {t("dashboard.income")}
                <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                {t("dashboard.expense")}
              </div>
              <svg viewBox="0 0 360 70" className="mt-1.5 w-full" role="img" aria-label={t("dashboard.cash_flow")}>
                <path d="M4 50 C30 42 38 25 65 34 S100 47 125 23 S165 12 185 31 S225 54 245 28 S280 15 300 36 S335 48 356 20" fill="none" stroke="#22C55E" strokeWidth="2" />
                <path d="M4 39 C30 51 42 44 65 48 S102 24 125 39 S163 55 185 46 S224 31 245 43 S280 52 300 47 S335 23 356 35" fill="none" stroke="#EF4444" strokeWidth="2" />
                {weekDays.map((day, index) => (
                  <text key={day} x={8 + index * 56} y="67" textAnchor="middle" className="fill-text-muted" fontSize="7">
                    {t(`landing.mock_chart_${day}`)}
                  </text>
                ))}
              </svg>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  income,
  expense,
  incomeLabel,
  expenseLabel,
  accent = false,
}: {
  label: string;
  amount: string;
  income: string;
  expense: string;
  incomeLabel: string;
  expenseLabel: string;
  accent?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className={`rounded-xl border-l-4 p-3 sm:p-3.5 ${accent ? "border-primary bg-surface shadow-card" : "border-border bg-surface"}`}>
      <p className="font-mono text-[8px] font-semibold uppercase tracking-wider text-text-muted">
        {label} · {t("landing.preview_date")}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <p className="font-mono text-base font-bold text-text-primary sm:text-lg">{amount}</p>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-[8px] font-semibold text-success">
          <ArrowUpRight className="h-2.5 w-2.5" />
          {t("dashboard.positive")}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border pt-2">
        <div>
          <p className="text-[8px] text-text-muted">{incomeLabel}</p>
          <p className="mt-0.5 inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-success">
            <ArrowUpRight className="h-2.5 w-2.5" />
            {income}
          </p>
        </div>
        <div>
          <p className="text-[8px] text-text-muted">{expenseLabel}</p>
          <p className="mt-0.5 inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-danger">
            <ArrowDownRight className="h-2.5 w-2.5" />
            {expense}
          </p>
        </div>
      </div>
    </div>
  );
}
