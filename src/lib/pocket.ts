export interface Pocket {
  id: string;
  name: string;
  category: "tunai" | "ewallet" | "rekening";
  sortOrder: number;
  createdAt: number;
}

export const PRESET_POCKETS: Array<{ name: string; category: Pocket["category"] }> = [
  { name: "Tunai", category: "tunai" },
  { name: "Dana", category: "ewallet" },
  { name: "Gopay", category: "ewallet" },
  { name: "BCA", category: "rekening" },
  { name: "Seabank", category: "rekening" },
  { name: "Bank Jago", category: "rekening" },
];

/** Old preset names that were removed — used by usePockets to clean up existing data. */
export const OLD_PRESET_NAMES = new Set(["Ovo", "Shopeepay", "BRI", "BNI", "Mandiri"]);
