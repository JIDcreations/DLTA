export const eurFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export const eurFormatterCompact = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 2,
});

export const percentFormatter = new Intl.NumberFormat("en-GB", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEUR(value: number, compact = false) {
  const formatter = compact ? eurFormatterCompact : eurFormatter;
  return formatter.format(value);
}

export function formatPct(value: number) {
  return percentFormatter.format(value);
}

export function formatQty(value: number) {
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

export function formatPrice(value: number) {
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatISOToInput(iso: string) {
  const date = new Date(iso);
  const tzOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
}

export function formatInputToISO(localValue: string) {
  const date = new Date(localValue);
  return date.toISOString();
}

export function clampNumber(value: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
