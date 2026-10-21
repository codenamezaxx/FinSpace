"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  PROFILE_META_KEY,
  parseProfile,
  readProfile,
  writeProfile,
  type ProfileOverride,
} from "@/lib/profile";

export interface UseProfileResult {
  /** User-typed display name; "" when unset (callers fall back to cloud). */
  name: string;
  /** Avatar data URL; "" when unset (callers fall back to cloud/initials). */
  picture: string;
  /**
   * False until the first IndexedDB read resolves. SSR and the first client
   * render both see false, so consumers can show a placeholder instead of
   * flashing an initials avatar before the override arrives.
   */
  ready: boolean;
  setName: (raw: string) => Promise<void>;
  setPicture: (dataUrl: string) => Promise<void>;
  clearPicture: () => Promise<void>;
}

/**
 * Live view of the editable profile override plus its write actions.
 *
 * Reads through `useLiveQuery` so the avatar/name update everywhere they are
 * rendered the moment the row changes — offline-first, no refresh, and the
 * change replicates through app_meta once the device is online.
 */
export function useProfile(): UseProfileResult {
  // Wrap the read in an object: `undefined` must mean "still loading", not
  // "row missing", otherwise the two states are indistinguishable.
  const loaded = useLiveQuery(
    async () => ({ raw: (await db.app_meta.get(PROFILE_META_KEY))?.value }),
    []
  );

  const ready = loaded !== undefined;
  const { name = "", picture = "" }: ProfileOverride = ready ? parseProfile(loaded.raw) : {};

  const setName = useCallback(async (raw: string) => {
    const current = await readProfile();
    await writeProfile({ ...current, name: raw.trim() || undefined });
  }, []);

  const setPicture = useCallback(async (dataUrl: string) => {
    const current = await readProfile();
    await writeProfile({ ...current, picture: dataUrl });
  }, []);

  const clearPicture = useCallback(async () => {
    const current = await readProfile();
    await writeProfile({ ...current, picture: undefined });
  }, []);

  return { name, picture, ready, setName, setPicture, clearPicture };
}
