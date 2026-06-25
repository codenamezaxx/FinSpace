"use client";

import type { HealthStatus } from "@/lib/financialRatios";
import { getStatusLabel } from "@/lib/financialRatios";

interface WealthSpeedometerProps {
  overallStatus: HealthStatus;
  liquidityStatus: HealthStatus;
  savingsStatus: HealthStatus;
  debtStatus: HealthStatus;
}

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

export function WealthSpeedometer({
  overallStatus,
  liquidityStatus,
  savingsStatus,
  debtStatus,
}: WealthSpeedometerProps) {
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

  // SVG semi-circle gauge
  const viewBoxWidth = 200;
  const viewBoxHeight = 120;
  const cx = viewBoxWidth / 2;
  const cy = 100;
  const radius = 75;

  // Score 0 = left (180°), score 100 = right (0°)
  const scoreFraction = compositeScore / 100;
  const needleAngle = Math.PI - scoreFraction * Math.PI;

  // Needle tip position
  const needleLength = radius - 8;
  const needleX = cx + needleLength * Math.cos(needleAngle);
  const needleY = cy - needleLength * Math.sin(needleAngle);

  // Arc path helper
  function describeArc(
    centerX: number,
    centerY: number,
    r: number,
    startA: number,
    endA: number
  ): string {
    const x1 = centerX + r * Math.cos(startA);
    const y1 = centerY - r * Math.sin(startA);
    const x2 = centerX + r * Math.cos(endA);
    const y2 = centerY - r * Math.sin(endA);
    const largeArc = startA - endA > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  // Colored segments for the arc
  const segments = [
    { from: 180, to: 120, color: "#EF4444" },
    { from: 120, to: 60, color: "#EAB393" },
    { from: 60, to: 0, color: "#22C55E" },
  ];

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-center">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full max-w-[220px]"
          aria-label={`Kesehatan keuangan: ${label}`}
        >
          {/* Background track */}
          <path
            d={describeArc(cx, cy, radius, Math.PI, 0)}
            fill="none"
            stroke="var(--color-track)"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Colored segments */}
          {segments.map((seg) => (
            <path
              key={seg.color}
              d={describeArc(
                cx,
                cy,
                radius,
                (seg.from * Math.PI) / 180,
                (seg.to * Math.PI) / 180
              )}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeLinecap="butt"
              opacity={compositeScore >= seg.to / 180 * 100 ? 1 : 0.15}
            />
          ))}

          {/* Active fill arc up to needle */}
          {compositeScore > 0 && (
            <path
              d={describeArc(cx, cy, radius, Math.PI, needleAngle)}
              fill="none"
              stroke={color}
              strokeWidth="14"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
            />
          )}

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = Math.PI - (tick / 100) * Math.PI;
            const outerR = radius + 10;
            const innerR = radius - 10;
            return (
              <g key={tick}>
                <line
                  x1={cx + outerR * Math.cos(angle)}
                  y1={cy - outerR * Math.sin(angle)}
                  x2={cx + innerR * Math.cos(angle)}
                  y2={cy - innerR * Math.sin(angle)}
                  stroke="var(--color-text-muted)"
                  strokeWidth="1"
                  opacity="0.4"
                />
              </g>
            );
          })}

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 4px ${color}60)`,
              transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
          <circle cx={cx} cy={cy} r="4" fill={color} />
          <circle
            cx={cx}
            cy={cy}
            r="2"
            fill="var(--color-surface)"
          />

          {/* Score text */}
          <text
            x={cx}
            y={cy - 16}
            textAnchor="middle"
            className="font-mono"
            fill={color}
            fontSize="18"
            fontWeight="700"
          >
            {compositeScore}
          </text>
        </svg>
      </div>

      {/* Status label */}
      <div className="mt-2 text-center">
        <span
          className="inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold"
          style={{
            backgroundColor: `${color}18`,
            color: color,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
