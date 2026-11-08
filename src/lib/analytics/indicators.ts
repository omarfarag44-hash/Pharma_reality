/**
 * Operational indicators: thresholds, status classification and the
 * composite branch performance index.
 */
import type { IndicatorStatus } from "@/domain/common";
import type { MonthlyMetrics } from "@/domain/branch";
import { achievementPct, averageBasket, percentOf, salesVariance, type Variance } from "./metrics";

export const INDICATOR_KEYS = [
  "achievement",
  "stockAvailability",
  "complianceScore",
  "slowMovingPct",
  "nearExpiryPct",
  "attendanceRate",
  "customerSatisfaction",
] as const;
export type IndicatorKey = (typeof INDICATOR_KEYS)[number];

interface Threshold {
  direction: "higher" | "lower";
  good: number;
  watch: number;
}

/** Thresholds are product decisions, documented here in one place. */
export const THRESHOLDS: Record<IndicatorKey, Threshold> = {
  achievement: { direction: "higher", good: 100, watch: 85 },
  stockAvailability: { direction: "higher", good: 95, watch: 90 },
  complianceScore: { direction: "higher", good: 90, watch: 80 },
  slowMovingPct: { direction: "lower", good: 8, watch: 14 },
  nearExpiryPct: { direction: "lower", good: 2.5, watch: 4.5 },
  attendanceRate: { direction: "higher", good: 96, watch: 93 },
  customerSatisfaction: { direction: "higher", good: 88, watch: 80 },
};

export function classify(key: IndicatorKey, value: number): IndicatorStatus {
  const t = THRESHOLDS[key];
  if (t.direction === "higher") return value >= t.good ? "good" : value >= t.watch ? "watch" : "critical";
  return value <= t.good ? "good" : value <= t.watch ? "watch" : "critical";
}

/** All figures derived from one month of raw metrics plus an attendance rate. */
export interface DerivedMetrics {
  month: string;
  salesTarget: number;
  salesActual: number;
  transactions: number;
  achievement: number;
  variance: Variance;
  averageBasket: number;
  stockAvailability: number;
  complianceScore: number;
  slowMovingPct: number;
  slowMovingValue: number;
  nearExpiryPct: number;
  nearExpiryValue: number;
  inventoryValue: number;
  customerSatisfaction: number;
  attendanceRate: number;
  provenance: MonthlyMetrics["provenance"];
}

export function deriveMetrics(m: MonthlyMetrics, attendanceRate: number): DerivedMetrics {
  return {
    month: m.month,
    salesTarget: m.salesTarget,
    salesActual: m.salesActual,
    transactions: m.transactions,
    achievement: achievementPct(m.salesActual, m.salesTarget),
    variance: salesVariance(m.salesActual, m.salesTarget),
    averageBasket: averageBasket(m.salesActual, m.transactions),
    stockAvailability: m.stockAvailability,
    complianceScore: m.complianceScore,
    slowMovingPct: percentOf(m.slowMovingValue, m.inventoryValue),
    slowMovingValue: m.slowMovingValue,
    nearExpiryPct: percentOf(m.nearExpiryValue, m.inventoryValue),
    nearExpiryValue: m.nearExpiryValue,
    inventoryValue: m.inventoryValue,
    customerSatisfaction: m.customerSatisfaction,
    attendanceRate,
    provenance: m.provenance,
  };
}

export type IndicatorStatuses = Record<IndicatorKey, IndicatorStatus>;

export function indicatorStatuses(d: DerivedMetrics): IndicatorStatuses {
  return Object.fromEntries(INDICATOR_KEYS.map((k) => [k, classify(k, d[k])])) as IndicatorStatuses;
}

const clamp100 = (v: number) => Math.min(100, Math.max(0, v));

/** Weights of the composite performance index (sum = 1). */
export const PERFORMANCE_INDEX_WEIGHTS = {
  achievement: 0.35,
  complianceScore: 0.2,
  stockAvailability: 0.15,
  customerSatisfaction: 0.1,
  attendanceRate: 0.1,
  nearExpiryPct: 0.05,
  slowMovingPct: 0.05,
} as const;

/**
 * Composite branch performance index on a 0–100 scale.
 * Each indicator is normalised to 0–100 before weighting.
 */
export function performanceIndex(d: DerivedMetrics): number {
  const normalised = {
    achievement: clamp100(((d.achievement - 60) / (115 - 60)) * 100),
    complianceScore: clamp100(d.complianceScore),
    stockAvailability: clamp100(((d.stockAvailability - 80) / 20) * 100),
    customerSatisfaction: clamp100(d.customerSatisfaction),
    attendanceRate: clamp100(((d.attendanceRate - 85) / 15) * 100),
    nearExpiryPct: clamp100(100 - d.nearExpiryPct * 12),
    slowMovingPct: clamp100(100 - d.slowMovingPct * 3.5),
  };
  return (Object.keys(PERFORMANCE_INDEX_WEIGHTS) as Array<keyof typeof PERFORMANCE_INDEX_WEIGHTS>).reduce(
    (sum, k) => sum + normalised[k] * PERFORMANCE_INDEX_WEIGHTS[k],
    0,
  );
}
