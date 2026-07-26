"use client";

import { Bell, AlertTriangle, Calendar } from "lucide-react";
import type { Notification } from "@/lib/db";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const typeConfig = {
  transaction: {
    icon: Bell,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  overspending: {
    icon: AlertTriangle,
    color: "text-danger",
    bgColor: "bg-danger/10",
  },
  credit_reminder: {
    icon: Calendar,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
} as const;

function formatRelativeTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function NotificationCard({ notification, onMarkAsRead, onClick }: NotificationCardProps) {
  const isUnread = !notification.read;
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => {
        if (isUnread) onMarkAsRead(notification.id);
        onClick?.(notification);
      }}
      className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
        isUnread
          ? "bg-primary/5"
          : "bg-transparent hover:bg-surface"
      }`}
    >
      {/* Icon */}
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${
            isUnread ? "text-text-primary" : "text-text-secondary"
          }`}>
            {notification.title}
          </p>
          {/* Unread dot */}
          {isUnread && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-text-muted line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-[11px] text-text-muted">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
