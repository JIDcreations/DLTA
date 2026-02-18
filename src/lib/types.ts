export type CoinSymbol = "BTC" | "ETH" | "XRP";
export type CalculationMode = "deriveQuantity" | "deriveEur";

export interface PurchaseLot {
  id: string;
  symbol: CoinSymbol;
  datetimeISO: string;
  eurSpent: number;
  buyPrice: number;
  quantity: number;
  note?: string;
}

export interface Preferences {
  refreshIntervalSeconds: number;
  showAdvanced: boolean;
  showNotes: boolean;
}

export interface CachedPrice {
  eur: number;
  change24h?: number;
  updatedAtISO: string;
}

export interface PortfolioState {
  lots: PurchaseLot[];
  preferences: Preferences;
  cachedPrices: Partial<Record<CoinSymbol, CachedPrice>>;
  schemaVersion: number;
}
