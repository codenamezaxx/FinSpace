export interface AssetEntry {
  id: string;
  name: string;
  amount: number;
  type: "liquid" | "investment" | "property" | "other";
}

export interface LiabilityEntry {
  id: string;
  name: string;
  amount: number;
}

export interface NetWorthResult {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
}

export function calculateNetWorth(
  assets: AssetEntry[],
  liabilities: LiabilityEntry[]
): NetWorthResult {
  const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const liquidAssets = assets
    .filter((a) => a.type === "liquid")
    .reduce((sum, a) => sum + a.amount, 0);

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    liquidAssets,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
