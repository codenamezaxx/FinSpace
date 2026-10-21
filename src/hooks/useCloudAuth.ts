"use client";

import { useObservable } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";

export interface CloudUser {
  name: string;
  email: string;
  picture?: string;
  isLoggedIn: boolean;
}

export function useCloudAuth() {
  const userLogin = useObservable(db.cloud.currentUser);
  // Editable name/avatar override — layered on top of the read-only OAuth
  // values, so every consumer (topbar avatar, popup, dashboard greeting,
  // settings) shows one consistent identity.
  const profile = useProfile();

  const user: CloudUser | null = userLogin?.isLoggedIn
    ? {
        name: profile.name || userLogin.name || "",
        email: userLogin.email ?? "",
        picture: profile.picture || userLogin.claims?.picture,
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
