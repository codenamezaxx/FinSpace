"use client";

import { useObservable } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useCallback } from "react";

export interface CloudUser {
  name: string;
  email: string;
  isLoggedIn: boolean;
}

export function useCloudAuth() {
  const userLogin = useObservable(db.cloud.currentUser);

  const user: CloudUser | null = userLogin?.isLoggedIn
    ? {
        name: userLogin.name ?? "",
        email: userLogin.email ?? "",
        isLoggedIn: true,
      }
    : null;

  const isLoggedIn = !!user;
  const isLoading = userLogin === undefined;

  const login = useCallback(async () => {
    await db.cloud.login({ provider: "google" });
  }, []);

  const logout = useCallback(async () => {
    await db.cloud.logout();
  }, []);

  return { user, isLoggedIn, isLoading, login, logout };
}
