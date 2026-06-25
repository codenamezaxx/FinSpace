"use client";

import { memo } from "react";

interface BudgetRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  remaining?: string;
  isOverBudget?: boolean;
}

export const BudgetRing = memo(function BudgetRing({
  percentage,
  size = 160,
  strokeWidth = 12,
  label,
  sublabel,
  remaining,
  isOverBudget = false,
}: BudgetRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(percentage, 100);
  const offset = circumference - (clampedPct / 100) * circumference;

  const getColor = () => {
    if (isOverBudget) return "var(--color-danger)";
    if (percentage > 80) return "var(--color-warning)";
    return "var(--color-primary)";
  };

  const strokeColor = getColor();

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.5}
        />
        {/* Progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        {/* Center percentage */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 fill-current font-mono text-2xl font-bold text-text-primary"
        >
          {clampedPct}%
        </text>
      </svg>

      {label && (
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      )}
      {sublabel && (
        <span className="text-xs text-text-muted">{sublabel}</span>
      )}
      {remaining && (
        <span
          className={`text-xs font-medium font-mono ${
            isOverBudget ? "text-danger" : "text-success"
          }`}
        >
          {remaining}
        </span>
      )}
    </div>
  );
});
