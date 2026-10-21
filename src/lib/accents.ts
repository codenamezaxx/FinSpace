/**
 * Single source of truth for accent variants.
 *
 * The array order is the AccentPicker order (default first, mono last).
 * Parser, type, localStorage whitelist, and the anti-FOUC script in
 * layout.tsx are all derived from this one list.
 */

export const ACCENT_IDS = [
  "default",
  "ember",
  "aqua",
  "nebula",
  "bloom",
  "mono",
] as const;

export type Accent = (typeof ACCENT_IDS)[number];

/** Swatch pair shown in AccentPicker (primary light, primary dark). */
export const ACCENT_DOTS: Record<Accent, [string, string]> = {
  default: ["#3B82F6", "#8940F9"],
  ember: ["#C2410C", "#F59E0B"],
  aqua: ["#0F766E", "#2DD4BF"],
  nebula: ["#7C3AED", "#A78BFA"],
  bloom: ["#BE123C", "#FB7185"],
  mono: ["#737373", "#A3A3A3"],
};

export function isAccent(value: string): value is Accent {
  return (ACCENT_IDS as readonly string[]).includes(value);
}

/** Stored accent value → Accent; anything unknown falls back to default. */
export function parseAccent(value: string | null): Accent {
  return value !== null && isAccent(value) ? value : "default";
}
