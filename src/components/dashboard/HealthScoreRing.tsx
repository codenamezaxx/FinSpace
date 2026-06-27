"use client";

import { scoreToColor, scoreToLabel } from "@/lib/financialRatios";

interface HealthScoreRingProps {
  score: number;
}

export function HealthScoreRing({ score }: HealthScoreRingProps) {
  const color = scoreToColor(score);
  const label = scoreToLabel(score);

  /* ── SVG ring ── */
  const size = 184;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="mb-4 flex flex-col items-center">
      <span className="mb-6 text-md font-mono font font-semibold text-text-primary">
        Skor Kesehatan Keseluruhan
      </span>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Skor kesehatan keuangan: ${score}`}
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
          className="font-mono text-3xl font-bold"
          fill="var(--color-text-primary)"
        >
          {score}
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
