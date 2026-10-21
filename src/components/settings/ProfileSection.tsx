"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, User } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useCloudAuth } from "@/hooks/useCloudAuth";
import { useLanguage } from "@/lib/i18n";
import {
  MAX_NAME_LENGTH,
  downscaleToAvatar,
  normalizeName,
} from "@/lib/profile";

/**
 * Settings → Profile.
 *
 * Replaces the old cloud-sync card. Name and avatar live in a synced app_meta
 * row (see src/lib/profile.ts), so they are editable while signed out and
 * replicate once the device is online. Sign-in / sign-out / force-sync stay in
 * the topbar profile menu.
 */
export function ProfileSection() {
  const { t } = useLanguage();
  const profile = useProfile();
  const { user, isLoggedIn } = useCloudAuth();

  const [nameDraft, setNameDraft] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInitialized = useRef(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed the input once the first IndexedDB read resolves — not on every
  // profile change, or a background sync would clobber in-progress typing.
  useEffect(() => {
    if (profile.ready && !nameInitialized.current) {
      nameInitialized.current = true;
      setNameDraft(profile.name);
    }
  }, [profile.ready, profile.name]);

  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedFlash(false), 1500);
  }, []);

  const handleNameBlur = useCallback(async () => {
    const clean = normalizeName(nameDraft);
    if (clean === profile.name) {
      setNameDraft(clean);
      return;
    }
    if (!clean) {
      // Reject an emptied field rather than wiping the stored name.
      setNameDraft(profile.name);
      return;
    }
    setError(null);
    try {
      await profile.setName(clean);
      setNameDraft(clean);
      flashSaved();
    } catch {
      setError(t("settings.profile_save_failed"));
    }
  }, [nameDraft, profile, t, flashSaved]);

  const handlePhotoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-picking the same file
      if (!file) return;
      setPhotoBusy(true);
      setError(null);
      try {
        await profile.setPicture(await downscaleToAvatar(file));
      } catch {
        setError(t("settings.profile_photo_failed"));
      } finally {
        setPhotoBusy(false);
      }
    },
    [profile, t]
  );

  const handleRemovePhoto = useCallback(async () => {
    setError(null);
    try {
      await profile.clearPicture();
    } catch {
      setError(t("settings.profile_save_failed"));
    }
  }, [profile, t]);

  const displayName = profile.name || user?.name || "";
  const initials = displayName ? displayName.charAt(0).toUpperCase() : "";

  return (
    <div className="mb-4 rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-text-primary">
        <User className="h-5 w-5 text-primary" />
        {t("settings.profile_title")}
      </h2>

      {/* ── Avatar + change/remove photo ── */}
      <div className="flex flex-col items-center pb-4">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-alt">
            {profile.picture ? (
              <img
                src={profile.picture}
                alt={displayName || t("profile.photo")}
                className="h-full w-full object-cover"
              />
            ) : initials ? (
              <span className="text-2xl font-bold text-on-primary bg-primary h-full w-full flex items-center justify-center">
                {initials}
              </span>
            ) : (
              <User className="h-8 w-8 text-text-muted" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoBusy}
            aria-label={t("settings.profile_change_photo")}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-primary hover:text-on-primary disabled:opacity-50"
          >
            {photoBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
        </div>

        {profile.picture && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="mt-2 text-xs text-text-muted underline-offset-2 transition-colors hover:text-danger hover:underline"
          >
            {t("settings.profile_remove_photo")}
          </button>
        )}
      </div>

      {/* ── Display name ── */}
      <label htmlFor="profile-name" className="mb-1.5 block text-xs text-text-muted">
        {t("settings.profile_name_label")}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-alt px-3 py-2.5 transition-colors focus-within:border-primary/40">
        <input
          id="profile-name"
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          maxLength={MAX_NAME_LENGTH}
          placeholder={t("settings.profile_name_placeholder")}
          className="w-full bg-transparent text-sm font-semibold text-text-primary outline-none placeholder:font-normal placeholder:text-text-muted"
        />
        {savedFlash && <Check className="h-4 w-4 shrink-0 text-success" />}
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}

      {/* ── Account context ── */}
      {isLoggedIn && user?.email ? (
        <p className="mt-3 truncate text-center text-xs font-mono text-text-muted">
          {user.email}
        </p>
      ) : (
        <p className="mt-3 text-center text-xs text-text-muted">
          {t("settings.profile_guest_hint")}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />
    </div>
  );
}
