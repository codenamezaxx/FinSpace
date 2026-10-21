import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import {
  PROFILE_META_KEY,
  MAX_NAME_LENGTH,
  MAX_PICTURE_CHARS,
  normalizeName,
  parseProfile,
  readProfile,
  writeProfile,
  type ProfileOverride,
} from "./profile";

/** A tiny, well-formed avatar data URL (1×1 red JPEG). */
const VALID_PIC = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

/** Assigned in beforeEach — the real Dexie instance over fake-indexeddb. */
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
let db!: (typeof import("./db"))["db"];

describe("normalizeName", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeName("  Budi   Santoso \n")).toBe("Budi Santoso");
  });

  it("strips control characters", () => {
    expect(normalizeName("Bu\u0000di\u0007 San\u001Ftoso")).toBe("Budi Santoso");
  });

  it("caps length at MAX_NAME_LENGTH", () => {
    const out = normalizeName("x".repeat(MAX_NAME_LENGTH + 40));
    expect(out).toHaveLength(MAX_NAME_LENGTH);
  });

  it("returns empty string when nothing usable remains", () => {
    expect(normalizeName("   \u0000\u001F  ")).toBe("");
  });
});

describe("parseProfile", () => {
  it("returns an empty override for null/undefined/empty", () => {
    expect(parseProfile(null)).toEqual({});
    expect(parseProfile(undefined)).toEqual({});
    expect(parseProfile("")).toEqual({});
  });

  it("returns an empty override for invalid JSON", () => {
    expect(parseProfile("{not json")).toEqual({});
  });

  it("returns an empty override for non-object JSON", () => {
    expect(parseProfile("5")).toEqual({});
    expect(parseProfile('"str"')).toEqual({});
    expect(parseProfile("null")).toEqual({});
    expect(parseProfile("[1,2]")).toEqual({});
  });

  it("normalizes a stored name and drops it when empty", () => {
    expect(parseProfile(JSON.stringify({ name: "  Budi  Santoso " }))).toEqual({
      name: "Budi Santoso",
    });
    expect(parseProfile(JSON.stringify({ name: "   " }))).toEqual({});
    expect(parseProfile(JSON.stringify({ name: 42 }))).toEqual({});
  });

  it("keeps a bounded image data URL picture", () => {
    expect(parseProfile(JSON.stringify({ picture: VALID_PIC }))).toEqual({
      picture: VALID_PIC,
    });
  });

  it("drops non-data-URL and oversized pictures", () => {
    expect(parseProfile(JSON.stringify({ picture: "https://x/y.png" }))).toEqual({});
    const oversized = `data:image/png;base64,${"A".repeat(MAX_PICTURE_CHARS)}`;
    expect(parseProfile(JSON.stringify({ picture: oversized }))).toEqual({});
  });

  it("drops pictures smuggling markup in the header", () => {
    const hostile = 'data:image/svg+xml,<svg onload="alert(1)">x';
    expect(parseProfile(JSON.stringify({ picture: hostile }))).toEqual({});
  });

  it("ignores unknown keys", () => {
    expect(parseProfile(JSON.stringify({ name: "A", evil: "<script>" }))).toEqual({
      name: "A",
    });
  });
});

describe("readProfile / writeProfile", () => {
  beforeEach(async () => {
    ({ db } = await import("./db"));
    await db.open();
    await db.app_meta.delete(PROFILE_META_KEY);
  });

  it("round-trips name and picture through app_meta", async () => {
    expect(await readProfile()).toEqual({});

    const next: ProfileOverride = { name: "Budi", picture: VALID_PIC };
    await writeProfile(next);

    expect(await readProfile()).toEqual(next);

    const row = await db.app_meta.get(PROFILE_META_KEY);
    expect(row?.key).toBe(PROFILE_META_KEY);
    expect(row?.value).toBe(JSON.stringify(next));
  });

  it("deletes the row when the override becomes empty", async () => {
    await writeProfile({ name: "Budi" });
    expect(await readProfile()).toEqual({ name: "Budi" });

    await writeProfile({});
    expect(await db.app_meta.get(PROFILE_META_KEY)).toBeUndefined();
    expect(await readProfile()).toEqual({});
  });

  it("deletes the row when nothing survives validation", async () => {
    await writeProfile({ name: "Budi" });
    await writeProfile({ name: "   ", picture: "https://x/y.png" });

    expect(await db.app_meta.get(PROFILE_META_KEY)).toBeUndefined();
    expect(await readProfile()).toEqual({});
  });

  it("sanitizes on write, not just on read", async () => {
    await writeProfile({ name: "  Budi \u0000 Santoso " });
    expect(await readProfile()).toEqual({ name: "Budi Santoso" });
  });
});
