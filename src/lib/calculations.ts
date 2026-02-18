import type { CalculationMode, CoinSymbol, PurchaseLot } from "./types";
import { clampNumber } from "./format";

export function holdingsByCoin(lots: PurchaseLot[]): Record<CoinSymbol, number> {
  return lots.reduce(
    (acc, lot) => {
      acc[lot.symbol] = (acc[lot.symbol] || 0) + lot.quantity;
      return acc;
    },
    { BTC: 0, ETH: 0, XRP: 0 } as Record<CoinSymbol, number>
  );
}

export function investedByCoin(lots: PurchaseLot[]): Record<CoinSymbol, number> {
  return lots.reduce(
    (acc, lot) => {
      acc[lot.symbol] = (acc[lot.symbol] || 0) + lot.eurSpent;
      return acc;
    },
    { BTC: 0, ETH: 0, XRP: 0 } as Record<CoinSymbol, number>
  );
}

export function avgBuyWeightedByCoin(lots: PurchaseLot[]): Record<CoinSymbol, number> {
  const totals = holdingsByCoin(lots);
  const invested = investedByCoin(lots);
  return (Object.keys(totals) as CoinSymbol[]).reduce((acc, symbol) => {
    const qty = totals[symbol];
    acc[symbol] = qty > 0 ? invested[symbol] / qty : 0;
    return acc;
  }, {} as Record<CoinSymbol, number>);
}

export function currentValueByCoin(
  holdings: Record<CoinSymbol, number>,
  livePrices: Partial<Record<CoinSymbol, number>>
): Record<CoinSymbol, number> {
  return (Object.keys(holdings) as CoinSymbol[]).reduce((acc, symbol) => {
    const price = livePrices[symbol] ?? 0;
    acc[symbol] = holdings[symbol] * price;
    return acc;
  }, {} as Record<CoinSymbol, number>);
}

export function pnlByCoin(
  invested: Record<CoinSymbol, number>,
  currentValue: Record<CoinSymbol, number>
): Record<CoinSymbol, { eur: number; pct: number }> {
  return (Object.keys(invested) as CoinSymbol[]).reduce((acc, symbol) => {
    const inv = invested[symbol];
    const cur = currentValue[symbol];
    const eur = cur - inv;
    const pct = inv > 0 ? eur / inv : 0;
    acc[symbol] = { eur, pct };
    return acc;
  }, {} as Record<CoinSymbol, { eur: number; pct: number }>);
}

export function perLotPnL(lot: PurchaseLot, livePrice?: number) {
  if (!livePrice) {
    return { eur: 0, pct: 0 };
  }
  const currentValue = lot.quantity * livePrice;
  const eur = currentValue - lot.eurSpent;
  const pct = lot.eurSpent > 0 ? eur / lot.eurSpent : 0;
  return { eur, pct };
}

export function totalInvested(lots: PurchaseLot[]): number {
  return lots.reduce((sum, lot) => sum + lot.eurSpent, 0);
}

export function totalValue(
  holdings: Record<CoinSymbol, number>,
  livePrices: Partial<Record<CoinSymbol, number>>
): number {
  return (Object.keys(holdings) as CoinSymbol[]).reduce(
    (sum, symbol) => sum + holdings[symbol] * (livePrices[symbol] ?? 0),
    0
  );
}

export function totalPnL(totalInvestedValue: number, totalValueValue: number) {
  const eur = totalValueValue - totalInvestedValue;
  const pct = totalInvestedValue > 0 ? eur / totalInvestedValue : 0;
  return { eur, pct };
}

export const TOLERANCE_EUR = 0.01;
export const TOLERANCE_QTY = 0.00000001;

export function normalizeLot<T extends PurchaseLot | Omit<PurchaseLot, "id">>(
  lot: T,
  mode: CalculationMode
): T {
  const buyPrice = lot.buyPrice;
  const eurSpent = lot.eurSpent;
  const quantity = lot.quantity;

  if (!buyPrice || buyPrice <= 0) {
    return {
      ...lot,
      buyPrice,
      eurSpent,
      quantity,
    };
  }

  if (mode === "deriveQuantity") {
    const computedQty = clampNumber(eurSpent / buyPrice, 8);
    const delta = Math.abs(computedQty - quantity);
    return {
      ...lot,
      quantity: delta <= TOLERANCE_QTY ? quantity : computedQty,
    };
  }

  const computedEur = clampNumber(quantity * buyPrice, 2);
  const delta = Math.abs(computedEur - eurSpent);
  return {
    ...lot,
    eurSpent: delta <= TOLERANCE_EUR ? eurSpent : computedEur,
  };
}

export function isLotInconsistent(lot: PurchaseLot, toleranceEUR = 0.5) {
  if (!lot.buyPrice || lot.buyPrice <= 0) {
    return false;
  }
  const expected = lot.quantity * lot.buyPrice;
  return Math.abs(lot.eurSpent - expected) > toleranceEUR;
}
