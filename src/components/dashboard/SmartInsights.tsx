"use client";

import { useState, useMemo } from "react";
import { Lightbulb, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import type { FinancialRatios, HealthStatus } from "@/lib/financialRatios";
import { getStatusColor, getStatusLabel } from "@/lib/financialRatios";
import { HealthScoreRing } from "./HealthScoreRing";
import insightsData from "@/lib/insights.json";

interface SmartInsightsProps {
  ratios: FinancialRatios;
  healthScore: number;
  liquidityStatus: HealthStatus;
  savingsStatus: HealthStatus;
  debtStatus: HealthStatus;
  overallStatus: HealthStatus;
}

type PriorityLevel = "high" | "medium" | "low";

function getPriorityWeight(p: PriorityLevel): number {
  switch (p) {
    case "high": return 3;
    case "medium": return 2;
    case "low": return 1;
  }
}

function getStatusBg(status: HealthStatus): string {
  switch (status) {
    case "safe": return "rgba(34,197,94,0.1)";
    case "warning": return "rgba(234,179,147,0.1)";
    case "danger": return "rgba(239,68,68,0.1)";
  }
}

export function SmartInsights({
  ratios,
  healthScore,
  liquidityStatus,
  savingsStatus,
  debtStatus,
  overallStatus,
}: SmartInsightsProps) {
  const [expanded, setExpanded] = useState(false);

  const insights = useMemo(() => {
    const result: Array<{
      category: string;
      title: string;
      message: string;
      action: string;
      priority: PriorityLevel;
      status: HealthStatus;
    }> = [];

    result.push({
      category: "Likuiditas",
      ...insightsData.liquidity[liquidityStatus],
      priority: insightsData.liquidity[liquidityStatus].priority as PriorityLevel,
      status: liquidityStatus,
    });
    result.push({
      category: "Tabungan",
      ...insightsData.savings[savingsStatus],
      priority: insightsData.savings[savingsStatus].priority as PriorityLevel,
      status: savingsStatus,
    });
    result.push({
      category: "Utang",
      ...insightsData.debt[debtStatus],
      priority: insightsData.debt[debtStatus].priority as PriorityLevel,
      status: debtStatus,
    });

    result.sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));

    return result;
  }, [liquidityStatus, savingsStatus, debtStatus]);

  const topInsight = insights[0];
  const topColor = getStatusColor(topInsight.status);

  return (
    <div className="glass rounded-2xl p-6">
      {/* Health Score Ring */}
      <HealthScoreRing score={healthScore} />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <Lightbulb className="h-5 w-5 text-accent" />
        <h2 className="text-sm font-semibold text-text-primary">Wawasan Cerdas</h2>
        {topInsight.priority === "high" && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-[10px] font-medium text-danger">
            <AlertTriangle className="h-3 w-3" />
            Perlu Tindakan
          </span>
        )}
      </div>

      {/* Top insight */}
      <button
        className="w-full rounded-xl p-4 text-left transition-all duration-200 hover:shadow-md"
        style={{ backgroundColor: getStatusBg(topInsight.status) }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-text-muted">
              {topInsight.category}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-text-primary">
              {topInsight.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              {topInsight.message}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <span
                className="inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold"
                style={{
                  backgroundColor: `${topColor}20`,
                  color: topColor,
                }}
              >
                {getStatusLabel(topInsight.status, true)}
              </span>
              <span className="text-xs font-medium" style={{ color: topColor }}>
                {topInsight.action}
              </span>
            </div>
          </div>
          <div className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-alt hover:text-text-secondary">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {insights.map((insight) => {
            const c = getStatusColor(insight.status);
            return (
              <div
                key={insight.category}
                className="rounded-xl border border-border p-4"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  {insight.category}
                </p>
                <p className="mt-1 text-sm font-medium text-text-primary">
                  {insight.title}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {insight.message}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${c}20`,
                      color: c,
                    }}
                  >
                    {getStatusLabel(insight.status, true)}
                  </span>
                  <span className="text-xs font-medium" style={{ color: c }}>
                    {insight.action}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
