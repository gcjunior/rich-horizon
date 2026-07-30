/** Money stored as integer cents throughout the app. */

export type Cents = number;

export function dollarsToCents(amount: number | string): Cents {
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function centsToDollars(cents: Cents): number {
  return cents / 100;
}

export function formatCAD(cents: Cents): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}$${dollars.toLocaleString('en-CA')}.${rem.toString().padStart(2, '0')}`;
}

export function clampNonNegative(cents: Cents): Cents {
  return Math.max(0, cents);
}

export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const idx = (sortedAsc.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  const w = idx - lo;
  return sortedAsc[lo] * (1 - w) + sortedAsc[hi] * w;
}
