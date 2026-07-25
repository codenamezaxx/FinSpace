"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Notification } from "@/lib/db";

type AddNotificationData = {
  type: Notification["type"];
  title: string;
  message: string;
  relatedId?: string;
};

export function useNotifications() {
  const notifications = useLiveQuery(
    () => db.notifications.orderBy("createdAt").reverse().toArray() as Promise<Notification[]>,
    []
  );

  const unreadCount = useLiveQuery(
    () => db.notifications.where("read").equals(0).count(),
    []
  );

  const addNotification = async (data: AddNotificationData): Promise<string> => {
    const id = `ntf${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await db.notifications.add({
      id,
      ...data,
      read: 0,
      createdAt: Date.now(),
    });
    return id;
  };

  const markAsRead = async (id: string) => {
    await db.notifications.update(id, { read: 1 });
  };

  const markAllAsRead = async () => {
    await db.notifications.where("read").equals(0).modify({ read: 1 });
  };

  const clearAll = async () => {
    await db.notifications.clear();
  };

  return {
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    loading: notifications === undefined,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
