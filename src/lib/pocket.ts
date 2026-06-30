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
  { name: "Ovo", category: "ewallet" },
  { name: "Shopeepay", category: "ewallet" },
  { name: "BCA", category: "rekening" },
  { name: "BRI", category: "rekening" },
  { name: "BNI", category: "rekening" },
  { name: "Mandiri", category: "rekening" },
  { name: "Seabank", category: "rekening" },
  { name: "Bank Jago", category: "rekening" },
];
