"use client";

import { memo, useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import {
  calculateMonthlyDebtObligation,
  remainingAmount,
  simulatePayoff,
} from "@/lib/debtUtils";
import {
  formatCurrency,
  formatInputValue,
  parseInputValue,
  type DebtEntry,
} from "@/lib/netWorth";
import { useLanguage } from "@/lib/i18n";

const inputClasses =
  "w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

export const PayoffSimulator = memo(function PayoffSimulator({
  debts,
}: {
  debts: DebtEntry[];
}) {
  const { t, lang } = useLanguage();
  const unpaid = useMemo(
    () => debts.filter((d) => remainingAmount(d) > 0),
    [debts]
  );
  const [selectedId, setSelectedId] = useState("");
  const [extra, setExtra] = useState("");

  const selected = unpaid.find((d) => d.id === selectedId) ?? unpaid[0];
  const remaining = selected ? remainingAmount(selected) : 0;
  const base = selected ? calculateMonthlyDebtObligation(selected) : 0;
  const sim = useMemo(
    () =>
      simulatePayoff(remaining, base, Number(extra) || 0, selected?.interestRate),
    [remaining, base, extra, selected]
  );

  if (!selected) {
    return (
      <div className="glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Calculator className="h-5 w-5 shrink-0 text-accent-secondary" />
          {t("wealth.sim_title")}
        </h2>
        <p className="mt-3 font-mono text-sm italic text-text-secondary/70">
          {t("wealth.sim_debt_free_state")}
        </p>
      </div>
    );
  }

  const locale = lang === "id" ? "id-ID" : "en-US";
  const debtFree = new Date(sim.debtFreeDate).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="glass min-w-0 rounded-2xl p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Calculator className="h-5 w-5 shrink-0 text-accent-secondary" />
        {t("wealth.sim_title")}
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="sim-debt"
            className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted"
          >
            {t("wealth.sim_debt_label")}
          </label>
          <select
            id="sim-debt"
            value={selected.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className={inputClasses}
          >
            {unpaid.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {formatCurrency(remainingAmount(d))}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="sim-extra"
            className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted"
          >
            {t("wealth.sim_extra_label")}
          </label>
          <input
            id="sim-extra"
            type="text"
            inputMode="numeric"
            value={formatInputValue(extra)}
            onChange={(e) => setExtra(parseInputValue(e.target.value))}
            placeholder="0"
            className={inputClasses}
          />
        </div>
      </div>

      {!sim.feasible ? (
        <p className="mt-4 font-mono text-xs text-warning">
          {t("wealth.sim_infeasible")}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-surface-alt p-3">
            <p className="font-mono text-2xl font-bold text-primary">{sim.months}</p>
            <p className="mt-0.5 font-mono text-[11px] text-text-muted">
              {t("wealth.sim_months")}
            </p>
          </div>
          <div className="rounded-xl bg-surface-alt p-3">
            <p className="font-mono text-sm font-bold capitalize leading-8 text-text-primary">
              {debtFree}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-text-muted">
              {t("wealth.sim_debt_free")}
            </p>
          </div>
          <div className="rounded-xl bg-surface-alt p-3">
            <p className="font-mono text-sm font-bold leading-8 text-success">
              {formatCurrency(sim.interestSaved)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-text-muted">
              {t("wealth.sim_interest_saved")}
            </p>
          </div>
        </div>
      )}

      <p className="mt-3 font-mono text-[11px] text-text-muted">
        {t("wealth.remaining_label")}: {formatCurrency(remaining)} · {t("wealth.max_label")}{" "}
        {formatCurrency(base)}/bln
      </p>
    </div>
  );
});
