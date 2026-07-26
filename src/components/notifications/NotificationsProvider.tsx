"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useNotifications as useNotificationsHook } from "@/hooks/useNotifications";
import type { Notification } from "@/lib/db";

interface NotificationsContextValue {
  // State
  isOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  toggleNotifications: () => void;

  // Data from hook
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotificationsContext must be used within NotificationsProvider");
  }
  return ctx;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const hook = useNotificationsHook();

  const openNotifications = useCallback(() => setIsOpen(true), []);
  const closeNotifications = useCallback(() => setIsOpen(false), []);
  const toggleNotifications = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <NotificationsContext.Provider
      value={{
        isOpen,
        openNotifications,
        closeNotifications,
        toggleNotifications,
        ...hook,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
