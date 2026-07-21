/**
 * Idempotent, atomic pocket preset seeder.
 *
 * Design principles:
 * - Module-level promise lock: concurrent callers SHARE the same in-flight
 *   operation. No race conditions regardless of how many usePockets() mount.
 * - Always dedup by name first, then add only missing presets.
 * - Called at most once per page session via the _seeded flag in usePockets.
 * - Safe to call even if DB is mid-sync or empty.
 */

import { db } from "./db";
import { PRESET_POCKETS } from "./pocket";

/** In-flight seed promise — concurrent callers await this same promise. */
let _seedPromise: Promise<void> | null = null;

/** Has seeding completed successfully this session? */
let _seeded = false;

export function hasSeeded(): boolean {
  return _seeded;
}

/**
 * Seed preset pockets. Idempotent — safe to call multiple times.
 * - Deduplicates existing pockets by name (keeps first, deletes rest).
 * - Only adds presets whose names don't already exist.
 * - Module-level lock prevents concurrent execution across all usePockets instances.
 */
export async function seedPresets(): Promise<void> {
  // Already seeded this session — skip entirely.
  if (_seeded) return;

  // Another call is in progress — wait for it instead of racing.
  if (_seedPromise) return _seedPromise;

  _seedPromise = _doSeed();
  try {
    await _seedPromise;
    _seeded = true;
  } finally {
    _seedPromise = null;
  }
}

/** Internal: the actual seed logic, guaranteed single-execution. */
async function _doSeed(): Promise<void> {
  try {
    // 1. Dedup existing pockets by name.
    const all = await db.pockets.toArray();
    const seen = new Set<string>();
    const dupIds: string[] = [];
    for (const p of all) {
      if (seen.has(p.name)) dupIds.push(p.id);
      else seen.add(p.name);
    }
    if (dupIds.length > 0) {
      await db.pockets.bulkDelete(dupIds);
    }

    // 2. Check which presets are missing (by name).
    const existingNames = new Set(
      (await db.pockets.toArray()).map((p) => p.name)
    );
    const missing = PRESET_POCKETS.filter((p) => !existingNames.has(p.name));
    if (missing.length === 0) return;

    // 3. Add only missing presets.
    const existingCount = await db.pockets.count();
    const now = Date.now();
    const presets = missing.map((p, i) => ({
      name: p.name,
      category: p.category,
      sortOrder: existingCount + i,
      createdAt: now,
    }));
    await db.pockets.bulkAdd(presets);
  } catch (err) {
    // Reset _seeded so next call can retry.
    _seeded = false;
    console.error("[seedPresets] gagal:", err);
  }
}

/**
 * Force re-seed (for logout/realm transition scenarios).
 * Resets the _seeded flag so next call to seedPresets() runs again.
 */
export function resetSeedFlag(): void {
  _seeded = false;
}
