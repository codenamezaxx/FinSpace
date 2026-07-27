/**
 * Shared constants — categories, payment methods, budget defaults.
 * Single source of truth; all components import from here.
 */

/** Expense categories */
export const EXPENSE_CATEGORIES: readonly string[] = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Tagihan",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
];

/** Income categories */
export const INCOME_CATEGORIES: readonly string[] = ["Gaji", "Freelance", "Investasi"];

/** Payment methods */
export const PAYMENT_METHODS: readonly string[] = [
  "Cash",
  "Transfer Bank",
  "QRIS",
  "Kartu Kredit",
  "Kartu Debit",
  "E-Wallet",
  "Lainnya",
];

/** Asset types for Net Worth */
export const ASSET_TYPES = [
  { value: "liquid", labelKey: "wealth.liquid" },
  { value: "investment", labelKey: "wealth.investment" },
  { value: "property", labelKey: "wealth.property" },
  { value: "other", labelKey: "wealth.other" },
] as const;

/** Maps canonical category names to i18n translation keys */
export const CATEGORY_LABEL_MAP: Record<string, string> = {
  "Makanan & Minuman": "transaction.food",
  Transportasi: "transaction.transport",
  Belanja: "transaction.shopping",
  Hiburan: "transaction.entertainment",
  Tagihan: "transaction.bills",
  Kesehatan: "transaction.health",
  Pendidikan: "transaction.education",
  Lainnya: "wealth.other",
};

/** All categories combined (for seed.ts) */
export const ALL_CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
] as const;

/** Sample merchants for seed data */
export const SEED_MERCHANTS = [
  "Bakso Pak Joko",
  "Gojek",
  "Tokopedia",
  "Netflix",
  "PLN",
  "Apotek Sehat",
  "Coursera",
  "Perusahaan XYZ",
  "Freelance Project",
  "Reksadana Online",
] as const;

/** Default 50/30/20 budget percentages */
export const BUDGET_DEFAULTS = {
  needs: 50,
  wants: 30,
  savings: 20,
} as const;
