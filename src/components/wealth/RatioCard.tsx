"use client";

import {
  HealthStatus,
  getStatusColor,
  getStatusLabel,
} from "@/lib/financialRatios";
import { memo, type ReactNode } from "react";

interface RatioCardProps {
  title: string;
  value: string | number;
  description: string;
  status: HealthStatus;
  icon?: ReactNode;
}

export const RatioCard = memo(function RatioCard({
  title,
  value,
  description,
  status,
  icon,
}: RatioCardProps) {
  const color = getStatusColor(status);

  return (
    <div className="glass rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-accent-secondary">{icon}</span>
        )}
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </p>
      </div>

      <p className="mt-2 font-mono text-2xl font-bold text-primary">
        {value}
      </p>

      <p className="mt-1 font-mono text-xs text-text-muted">{description}</p>

      <div className="mt-3 flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-wide"
          style={{ color }}
        >
          {getStatusLabel(status)}
        </span>
      </div>
    </div>
  );
});
