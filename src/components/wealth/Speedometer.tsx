"use client";

import { memo } from "react";

interface SpeedometerProps {
  value: number;
  label: string;
  sublabel?: string;
  status: "safe" | "warning" | "danger";
  size?: number;
}

const STATUS_CONFIG = {
  safe: { color: "var(--color-success)", label: "Safe" },
  warning: { color: "var(--color-warning)", label: "Warning" },
  danger: { color: "var(--color-danger)", label: "Danger" },
} as const;

export const Speedometer = memo(function Speedometer({
  value,
  label,
  sublabel,
  status,
  size = 200,
}: SpeedometerProps) {
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (clampedValue / 100) * circumference;

  const config = STATUS_CONFIG[status];

  const svgHeight = Math.ceil(size / 2 + 48);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={svgHeight}
        viewBox={`0 0 ${size} ${svgHeight}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={describeArc(size / 2, size / 2, radius, 180, 0)}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={describeArc(size / 2, size / 2, radius, 180, 0)}
          fill="none"
          stroke={config.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />

        {/* Value text */}
        <text
          x={size / 2}
          y={size / 2 + 4}
          textAnchor="middle"
          className="font-mono text-3xl font-bold"
          fill="var(--color-text-primary)"
        >
          {clampedValue}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 26}
          textAnchor="middle"
          className="font-mono text-xs"
          fill="var(--color-text-muted)"
        >
          out of 100
        </text>
      </svg>

      <span className="mt-14 font-mono text-sm font-semibold text-text-primary">
        {label}
      </span>
      {sublabel && (
        <span className="font-mono text-xs text-text-muted">{sublabel}</span>
      )}
      <span
        className="rounded-full px-3 py-1 font-mono text-xs font-medium"
        style={{
          backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
          color: config.color,
        }}
      >
        {config.label}
      </span>
    </div>
  );
});

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = ((angleDeg - 180) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}
