import type { CoinSymbol } from "./types";
import { COIN_BY_SYMBOL, COIN_SYMBOLS, getCoinId } from "./coins";

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface LivePrice {
  eur: number;
  change24h?: number;
  updatedAtISO: string;
}

export type LivePriceMap = Partial<Record<CoinSymbol, LivePrice>>;

export async function fetchCurrentPrices(
  symbols: CoinSymbol[] = COIN_SYMBOLS
): Promise<LivePriceMap> {
  const ids = symbols.map((symbol) => getCoinId(symbol)).join(",");
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch current prices");
  }

  const data = (await response.json()) as Record<
    string,
    { eur: number; eur_24h_change?: number }
  >;

  const updatedAtISO = new Date().toISOString();
  return symbols.reduce<LivePriceMap>((acc, symbol) => {
    const id = getCoinId(symbol);
    const entry = data[id];
    if (entry) {
      acc[symbol] = {
        eur: entry.eur,
        change24h: entry.eur_24h_change,
        updatedAtISO,
      };
    }
    return acc;
  }, {});
}

export async function fetchMarketChart(
  symbol: CoinSymbol,
  days: 7 | 30
): Promise<PricePoint[]> {
  const id = COIN_BY_SYMBOL[symbol].coingeckoId;
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=eur&days=${days}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch market chart");
  }

  const data = (await response.json()) as { prices: [number, number][] };
  return data.prices.map(([timestamp, price]) => ({ timestamp, price }));
}
