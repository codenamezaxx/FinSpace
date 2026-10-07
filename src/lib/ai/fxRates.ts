/**
 * Live foreign-exchange rates for Finny's currency conversion (server-side).
 *
 * Free endpoint, no API key: open.er-api.com. Results are cached in memory
 * for 12h; any failure falls back to static anchors so conversion still
 * works (approximately) instead of breaking the request.
 */

const ENDPOINT = "https://open.er-api.com/v6/latest/USD";
const TTL_MS = 12 * 3600 * 1000;
const FETCH_TIMEOUT_MS = 8000;

const TRACKED = [
  "USD",
  "SGD",
  "EUR",
  "MYR",
  "JPY",
  "AUD",
  "GBP",
  "CNY",
  "THB",
  "KRW",
  "HKD",
] as const;

const FALLBACK =
  "KURS ACUAN (bisa basi — hanya dipakai bila kurs live tak tersedia): " +
  "1 USD ≈ Rp16.000; 1 SGD ≈ Rp12.000; 1 EUR ≈ Rp17.000; " +
  "1 MYR ≈ Rp3.500; 1 JPY ≈ Rp110.";

let cache: { at: number; text: string } | null = null;

/** Reset the in-memory cache — tests only. */
export function __resetFxCache(): void {
  cache = null;
}

export async function getFxContext(now: number = Date.now()): Promise<string> {
  if (cache && now - cache.at < TTL_MS) return cache.text;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(ENDPOINT, { signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error(`fx status ${res.status}`);
    const data = (await res.json()) as {
      result?: string;
      time_last_update_utc?: string;
      rates?: Record<string, number>;
    };
    const rates = data?.rates;
    if (data?.result !== "success" || !rates || typeof rates.IDR !== "number") {
      throw new Error("fx bad payload");
    }
    const idr = rates.IDR as number;
    const parts: string[] = [];
    for (const code of TRACKED) {
      const r = rates[code];
      if (typeof r !== "number" || r <= 0) continue;
      parts.push(
        `1 ${code} = Rp${Math.round(idr / r).toLocaleString("id-ID")}`
      );
    }
    if (parts.length === 0) throw new Error("fx empty rates");
    const when = data.time_last_update_utc ?? new Date(now).toUTCString();
    const text =
      `KURS LIVE (sumber: open.er-api.com, ${when}): ` +
      parts.join("; ") +
      ". WAJIB pakai kurs live ini untuk konversi ke IDR (jangan pakai hafalan/acuan lama).";
    cache = { at: now, text };
    return text;
  } catch {
    return FALLBACK;
  }
}
