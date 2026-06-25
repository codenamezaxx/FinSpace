"use client";

import type { HealthStatus } from "@/lib/financialRatios";
import { getStatusLabel } from "@/lib/financialRatios";

function statusToScore(status: HealthStatus): number {
  switch (status) {
    case "safe": return 100;
    case "warning": return 50;
    case "danger": return 0;
  }
}

function scoreToColor(score: number): string {
  if (score >= 67) return "#22C55E";
  if (score >= 34) return "#EAB393";
  return "#EF4444";
}

interface HealthScoreRingProps {
  liquidityStatus: HealthStatus;
  savingsStatus: HealthStatus;
  debtStatus: HealthStatus;
  overallStatus: HealthStatus;
}

export function HealthScoreRing({
  liquidityStatus,
  savingsStatus,
  debtStatus,
  overallStatus,
}: HealthScoreRingProps) {
  /* ── Composite score ── */
  const scores = [
    statusToScore(liquidityStatus),
    statusToScore(savingsStatus),
    statusToScore(debtStatus),
  ];
  const compositeScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  );

  const color = scoreToColor(compositeScore);
  const label = getStatusLabel(overallStatus, true);

  /* ── SVG ring ── */
  const size = 112;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (compositeScore / 100) * circumference;

  return (
    <div className="mb-4 flex flex-col items-center">
      <span className="mb-6 text-md font-mono text-text-muted">
        Overall Health Score
      </span>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Skor kesehatan keuangan: ${compositeScore}`}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth={strokeWidth}
        />

        {/* Fill arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-1000 ease-out"
        />

        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 - 2}
          textAnchor="middle"
          className="font-mono text-2xl font-bold"
          fill="var(--color-text-primary)"
        >
          {compositeScore}
        </text>

        {/* Status label */}
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          className="font-mono text-[10px] font-semibold"
          fill={color}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
