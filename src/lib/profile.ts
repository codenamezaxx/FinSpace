import { db } from "@/lib/db";

/**
 * Editable profile (display name + avatar) stored in the existing synced
 * `app_meta` key-value table.
 *
 * Why app_meta and not a new table: Dexie Cloud rejects `@`-prefixed keys
 * that do not carry the table's own prefix (see ids.ts) and adding a table
 * means a schema bump for everyone. `app_meta` already exists at v7, already
 * replicates, and its `app-` key prefix is the established convention.
 *
 * The cloud user record itself is read-only from the client — Dexie Cloud
 * exposes no API to overwrite the OAuth-provided name/picture — so this row
 * acts as a local-first override layered on top of `currentUser`.
 */

/** Synced app_meta key holding the profile override. */
export const PROFILE_META_KEY = "app-profile";

export interface ProfileOverride {
  /** User-typed display name. Absent = fall back to the cloud user's name. */
  name?: string;
  /** Avatar as a `data:` URL. Absent = fall back to the cloud picture/initials. */
  picture?: string;
}

/** Hard caps so one synced row never bloats Dexie Cloud replication. */
export const MAX_NAME_LENGTH = 60;
/** Encoded dataURL ceiling for a stored avatar, in characters. */
export const MAX_PICTURE_CHARS = 200_000;
/** Longest edge the stored avatar is resized to — plenty for a 96px slot. */
export const AVATAR_MAX_EDGE = 256;
/** JPEG quality used when re-encoding a picked image. */
export const AVATAR_QUALITY = 0.82;

/**
 * Sanitize a display name: strip control characters, collapse internal
 * whitespace, trim, and cap length. Returns "" when nothing usable remains.
 */
export function normalizeName(raw: string): string {
  return raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

/** Coerce arbitrary stored JSON into a well-formed override. Never throws. */
export function parseProfile(raw: string | undefined | null): ProfileOverride {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null) return {};

  const out: ProfileOverride = {};
  const rec = parsed as Record<string, unknown>;

  if (typeof rec.name === "string") {
    const name = normalizeName(rec.name);
    if (name) out.name = name;
  }
  if (typeof rec.picture === "string" && isStoredPicture(rec.picture)) {
    out.picture = rec.picture;
  }
  return out;
}

/** A stored avatar must be a bounded image data URL — nothing else. */
function isStoredPicture(value: string): boolean {
  return (
    value.startsWith("data:image/") &&
    value.length <= MAX_PICTURE_CHARS &&
    // Guard against a hostile/broken row smuggling markup through the src attr.
    !/[<>"']/.test(value.slice(0, 64))
  );
}

export async function readProfile(): Promise<ProfileOverride> {
  const row = await db.app_meta.get(PROFILE_META_KEY);
  return parseProfile(row?.value);
}

/**
 * Persist the override. An empty override deletes the row entirely so the
 * cloud values (and the initials fallback) come back untouched.
 */
export async function writeProfile(next: ProfileOverride): Promise<void> {
  const clean = parseProfile(JSON.stringify(next));
  if (!clean.name && !clean.picture) {
    await db.app_meta.delete(PROFILE_META_KEY);
    return;
  }
  await db.app_meta.put({ key: PROFILE_META_KEY, value: JSON.stringify(clean) });
}

/**
 * Resize a picked image to an avatar-sized JPEG data URL.
 *
 * Canvas alpha is flattened onto white before encoding — a transparent PNG
 * would otherwise encode as a black square under JPEG. Throws on unloadable
 * files or when the result still exceeds MAX_PICTURE_CHARS.
 */
export async function downscaleToAvatar(file: Blob): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image-load-failed"));
      el.src = objectUrl;
    });

    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (!longest) throw new Error("image-zero-size");
    const scale = Math.min(1, AVATAR_MAX_EDGE / longest);
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas-unavailable");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", AVATAR_QUALITY);
    if (dataUrl.length > MAX_PICTURE_CHARS) throw new Error("picture-too-large");
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
