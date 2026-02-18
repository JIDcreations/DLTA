import type { CoinSymbol } from "./types";

export interface CoinInfo {
  symbol: CoinSymbol;
  name: string;
  coingeckoId: string;
  accent: string;
}

export const COINS: CoinInfo[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    coingeckoId: "bitcoin",
    accent: "#F7931A",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    coingeckoId: "ethereum",
    accent: "#627EEA",
  },
  {
    symbol: "XRP",
    name: "XRP",
    coingeckoId: "ripple",
    accent: "#00AAE4",
  },
];

export const COIN_BY_SYMBOL = COINS.reduce<Record<CoinSymbol, CoinInfo>>(
  (acc, coin) => {
    acc[coin.symbol] = coin;
    return acc;
  },
  {} as Record<CoinSymbol, CoinInfo>
);

export const COIN_SYMBOLS = COINS.map((coin) => coin.symbol);

export function isCoinSymbol(value: string): value is CoinSymbol {
  return COIN_SYMBOLS.includes(value as CoinSymbol);
}

export function getCoinId(symbol: CoinSymbol): string {
  return COIN_BY_SYMBOL[symbol].coingeckoId;
}
