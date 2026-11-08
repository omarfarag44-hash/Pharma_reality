/**
 * Core business calculations. Pure functions, no I/O, fully unit-tested.
 * Ratios are never stored; they are always derived from raw facts here.
 */

export function safeDivide(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return numerator / denominator;
}

/** Sales achievement as a percentage of target (100 = on target). */
export function achievementPct(actual: number, target: number): number {
  if (target <= 0) return 0;
  return (actual / target) * 100;
}

export interface Variance {
  /** actual − target, in currency. */
  amount: number;
  /** (actual − target) / target × 100. */
  pct: number;
}

export function salesVariance(actual: number, target: number): Variance {
  return { amount: actual - target, pct: target > 0 ? ((actual - target) / target) * 100 : 0 };
}

/** Average basket (transaction) value. */
export function averageBasket(sales: number, transactions: number): number {
  return safeDivide(sales, transactions);
}

export function percentOf(part: number, whole: number): number {
  return safeDivide(part, whole) * 100;
}

export type TrendDirection = "up" | "down" | "flat";

export interface Trend {
  first: number;
  last: number;
  /** % change from first to last value. */
  changePct: number;
  /** Least-squares slope per period, as % of the series mean. */
  slopePct: number;
  direction: TrendDirection;
}

/**
 * Trend of a time series. Direction uses the regression slope so a single
 * noisy month does not flip the reading. `flatThresholdPct` is per period.
 */
export function trend(values: number[], flatThresholdPct = 0.5): Trend {
  if (values.length === 0) return { first: 0, last: 0, changePct: 0, slopePct: 0, direction: "flat" };
  const n = values.length;
  const first = values[0]!;
  const last = values[n - 1]!;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const xMean = (n - 1) / 2;
  let num = 0;
  let den = 0;
  values.forEach((v, i) => {
    num += (i - xMean) * (v - mean);
    den += (i - xMean) ** 2;
  });
  const slope = den === 0 ? 0 : num / den;
  const slopePct = mean === 0 ? 0 : (slope / mean) * 100;
  const direction: TrendDirection = slopePct > flatThresholdPct ? "up" : slopePct < -flatThresholdPct ? "down" : "flat";
  return { first, last, changePct: first === 0 ? 0 : ((last - first) / first) * 100, slopePct, direction };
}

/** Attendance rate (%) from shift-level totals. */
export function attendanceRate(records: Array<{ scheduledShifts: number; attendedShifts: number }>): number {
  const scheduled = records.reduce((s, r) => s + r.scheduledShifts, 0);
  const attended = records.reduce((s, r) => s + r.attendedShifts, 0);
  return scheduled === 0 ? 0 : (attended / scheduled) * 100;
}

export function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export function weightedMean(items: Array<{ value: number; weight: number }>): number {
  const w = items.reduce((s, i) => s + i.weight, 0);
  return w === 0 ? 0 : items.reduce((s, i) => s + i.value * i.weight, 0) / w;
}
