/**
 * Ranking, regional aggregation, attention flags and employee summaries.
 */
import type { IndicatorStatus } from "@/domain/common";
import { classify, INDICATOR_KEYS, type DerivedMetrics, type IndicatorKey } from "./indicators";
import { achievementPct, averageBasket, mean, median } from "./metrics";

// ---------------------------------------------------------------- Ranking

export const BRANCH_SORT_KEYS = [
  "performance",
  "achievement",
  "sales",
  "stock",
  "compliance",
  "expiry",
  "satisfaction",
  "code",
] as const;
export type BranchSortKey = (typeof BRANCH_SORT_KEYS)[number];

export interface Rankable {
  code: string;
  performanceIndex: number;
  current: DerivedMetrics;
}

/** Value used for sorting; higher is always better so ranking is consistent. */
export function sortValue(item: Rankable, key: BranchSortKey): number {
  switch (key) {
    case "performance":
      return item.performanceIndex;
    case "achievement":
      return item.current.achievement;
    case "sales":
      return item.current.salesActual;
    case "stock":
      return item.current.stockAvailability;
    case "compliance":
      return item.current.complianceScore;
    case "expiry":
      return -item.current.nearExpiryPct;
    case "satisfaction":
      return item.current.customerSatisfaction;
    case "code":
      return 0;
  }
}

export function sortBranches<T extends Rankable>(items: T[], key: BranchSortKey, direction: "desc" | "asc" = "desc"): T[] {
  const sorted = [...items].sort((a, b) => {
    if (key === "code") return a.code.localeCompare(b.code);
    const diff = sortValue(b, key) - sortValue(a, key);
    return diff !== 0 ? diff : a.code.localeCompare(b.code);
  });
  return direction === "asc" ? sorted.reverse() : sorted;
}

/** 1-based rank by composite performance index (ties share the better rank). */
export function rankByPerformance<T extends Rankable>(items: T[]): Map<string, number> {
  const sorted = sortBranches(items, "performance");
  const ranks = new Map<string, number>();
  sorted.forEach((item, i) => {
    const prev = sorted[i - 1];
    ranks.set(item.code, prev && prev.performanceIndex === item.performanceIndex ? ranks.get(prev.code)! : i + 1);
  });
  return ranks;
}

// ---------------------------------------------------------------- Aggregation

export interface AggregateMetrics {
  count: number;
  salesTarget: number;
  salesActual: number;
  transactions: number;
  /** Weighted: total actual / total target. */
  achievement: number;
  averageBasket: number;
  stockAvailability: number;
  complianceScore: number;
  customerSatisfaction: number;
  attendanceRate: number;
  nearExpiryPct: number;
  slowMovingPct: number;
}

export function aggregate(items: DerivedMetrics[]): AggregateMetrics {
  const salesTarget = items.reduce((s, m) => s + m.salesTarget, 0);
  const salesActual = items.reduce((s, m) => s + m.salesActual, 0);
  const transactions = items.reduce((s, m) => s + m.transactions, 0);
  const inventory = items.reduce((s, m) => s + m.inventoryValue, 0);
  return {
    count: items.length,
    salesTarget,
    salesActual,
    transactions,
    achievement: achievementPct(salesActual, salesTarget),
    averageBasket: averageBasket(salesActual, transactions),
    stockAvailability: mean(items.map((m) => m.stockAvailability)),
    complianceScore: mean(items.map((m) => m.complianceScore)),
    customerSatisfaction: mean(items.map((m) => m.customerSatisfaction)),
    attendanceRate: mean(items.map((m) => m.attendanceRate)),
    nearExpiryPct: inventory === 0 ? 0 : (items.reduce((s, m) => s + m.nearExpiryValue, 0) / inventory) * 100,
    slowMovingPct: inventory === 0 ? 0 : (items.reduce((s, m) => s + m.slowMovingValue, 0) / inventory) * 100,
  };
}

export function groupAggregate<T>(items: T[], keyOf: (item: T) => string, metricsOf: (item: T) => DerivedMetrics): Array<{ key: string; metrics: AggregateMetrics }> {
  const groups = new Map<string, DerivedMetrics[]>();
  items.forEach((item) => {
    const k = keyOf(item);
    groups.set(k, [...(groups.get(k) ?? []), metricsOf(item)]);
  });
  return [...groups.entries()].map(([key, list]) => ({ key, metrics: aggregate(list) }));
}

// ---------------------------------------------------------------- Attention flags

export interface AttentionFlag {
  indicator: IndicatorKey;
  status: Exclude<IndicatorStatus, "good">;
  value: number;
}

export function attentionFlags(m: DerivedMetrics): AttentionFlag[] {
  return INDICATOR_KEYS.flatMap((k) => {
    const status = classify(k, m[k]);
    return status === "good" ? [] : [{ indicator: k, status, value: m[k] }];
  });
}

/** Severity score: critical = 3, watch = 1. A branch needs attention at score ≥ 4 (e.g. one critical + one watch, or four watches). */
export function attentionScore(flags: AttentionFlag[]): number {
  return flags.reduce((s, f) => s + (f.status === "critical" ? 3 : 1), 0);
}

export const ATTENTION_THRESHOLD = 4;

export function needsAttention(flags: AttentionFlag[]): boolean {
  return attentionScore(flags) >= ATTENTION_THRESHOLD;
}

/**
 * Strengths and opportunities relative to the area average.
 * A strength is a "good" indicator that also beats the area average;
 * an opportunity is any indicator classified watch/critical.
 */
export function strengthsAndOpportunities(
  m: DerivedMetrics,
  area: Record<IndicatorKey, number>,
): { strengths: IndicatorKey[]; opportunities: AttentionFlag[] } {
  const strengths = INDICATOR_KEYS.filter((k) => {
    const lowerIsBetter = k === "slowMovingPct" || k === "nearExpiryPct";
    const beats = lowerIsBetter ? m[k] < area[k] : m[k] > area[k];
    return classify(k, m[k]) === "good" && beats;
  });
  return { strengths, opportunities: attentionFlags(m) };
}

// ---------------------------------------------------------------- Employees

export const PERFORMANCE_BANDS = ["exceptional", "strong", "solid", "developing", "below"] as const;
export type PerformanceBand = (typeof PERFORMANCE_BANDS)[number];

export function performanceBand(score: number): PerformanceBand {
  if (score >= 90) return "exceptional";
  if (score >= 80) return "strong";
  if (score >= 70) return "solid";
  if (score >= 60) return "developing";
  return "below";
}

export interface EmployeePerformanceSummary {
  count: number;
  average: number;
  median: number;
  distribution: Record<PerformanceBand, number>;
  topPerformerIds: string[];
  needsSupportIds: string[];
}

export function summariseEmployeePerformance(items: Array<{ id: string; score: number }>, topN = 5): EmployeePerformanceSummary {
  const distribution = Object.fromEntries(PERFORMANCE_BANDS.map((b) => [b, 0])) as Record<PerformanceBand, number>;
  items.forEach((i) => (distribution[performanceBand(i.score)] += 1));
  const sorted = [...items].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return {
    count: items.length,
    average: mean(items.map((i) => i.score)),
    median: median(items.map((i) => i.score)),
    distribution,
    topPerformerIds: sorted.slice(0, topN).map((i) => i.id),
    needsSupportIds: sorted.filter((i) => i.score < 65).map((i) => i.id),
  };
}

export type ExperienceBand = "0-2" | "3-5" | "6-10" | "11+";
export function experienceBand(years: number): ExperienceBand {
  if (years <= 2) return "0-2";
  if (years <= 5) return "3-5";
  if (years <= 10) return "6-10";
  return "11+";
}
