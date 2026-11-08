import { describe, expect, it } from "vitest";
import {
  achievementPct,
  aggregate,
  attendanceRate,
  attentionFlags,
  attentionScore,
  averageBasket,
  classify,
  deriveMetrics,
  experienceBand,
  median,
  needsAttention,
  performanceBand,
  performanceIndex,
  rankByPerformance,
  salesVariance,
  sortBranches,
  strengthsAndOpportunities,
  summariseEmployeePerformance,
  trend,
  weightedMean,
  type DerivedMetrics,
} from "@/lib/analytics";
import type { MonthlyMetrics } from "@/domain/branch";

const raw = (o: Partial<MonthlyMetrics> = {}): MonthlyMetrics => ({
  month: "2026-12-01",
  salesTarget: 500_000,
  salesActual: 525_000,
  transactions: 4_200,
  stockAvailability: 96,
  inventoryValue: 600_000,
  slowMovingValue: 36_000,
  nearExpiryValue: 9_000,
  complianceScore: 92,
  customerSatisfaction: 90,
  provenance: "simulated_current",
  ...o,
});

describe("sales calculations", () => {
  it("computes achievement percentage", () => {
    expect(achievementPct(525_000, 500_000)).toBeCloseTo(105);
    expect(achievementPct(0, 500_000)).toBe(0);
    expect(achievementPct(100, 0)).toBe(0);
  });
  it("computes sales variance in currency and percent", () => {
    expect(salesVariance(450_000, 500_000)).toEqual({ amount: -50_000, pct: -10 });
    expect(salesVariance(550_000, 500_000).pct).toBeCloseTo(10);
  });
  it("computes average basket safely", () => {
    expect(averageBasket(525_000, 4_200)).toBeCloseTo(125);
    expect(averageBasket(100, 0)).toBe(0);
  });
  it("computes attendance rate from shifts", () => {
    expect(attendanceRate([{ scheduledShifts: 26, attendedShifts: 25 }, { scheduledShifts: 26, attendedShifts: 26 }])).toBeCloseTo((51 / 52) * 100);
    expect(attendanceRate([])).toBe(0);
  });
  it("derives ratios from raw metrics", () => {
    const d = deriveMetrics(raw(), 97);
    expect(d.achievement).toBeCloseTo(105);
    expect(d.averageBasket).toBeCloseTo(125);
    expect(d.slowMovingPct).toBeCloseTo(6);
    expect(d.nearExpiryPct).toBeCloseTo(1.5);
    expect(d.attendanceRate).toBe(97);
  });
});

describe("trend", () => {
  it("detects rising, falling and flat series", () => {
    expect(trend([100, 102, 104, 106]).direction).toBe("up");
    expect(trend([100, 97, 94, 91]).direction).toBe("down");
    expect(trend([100, 100.1, 99.9, 100]).direction).toBe("flat");
  });
  it("reports change from first to last", () => {
    expect(trend([200, 250]).changePct).toBeCloseTo(25);
  });
  it("handles empty input", () => {
    expect(trend([]).direction).toBe("flat");
  });
});

describe("indicator classification", () => {
  it("classifies higher-is-better indicators", () => {
    expect(classify("achievement", 100)).toBe("good");
    expect(classify("achievement", 90)).toBe("watch");
    expect(classify("achievement", 80)).toBe("critical");
    expect(classify("stockAvailability", 95)).toBe("good");
    expect(classify("complianceScore", 79.9)).toBe("critical");
  });
  it("classifies lower-is-better indicators", () => {
    expect(classify("nearExpiryPct", 2)).toBe("good");
    expect(classify("nearExpiryPct", 4)).toBe("watch");
    expect(classify("slowMovingPct", 20)).toBe("critical");
  });
});

describe("performance index & ranking", () => {
  const strong = deriveMetrics(raw({ salesActual: 560_000 }), 98);
  const weak = deriveMetrics(raw({ salesActual: 390_000, stockAvailability: 86, complianceScore: 70, nearExpiryValue: 42_000, slowMovingValue: 120_000, customerSatisfaction: 74 }), 90);
  it("scores a strong branch above a weak one, within 0–100", () => {
    const a = performanceIndex(strong);
    const b = performanceIndex(weak);
    expect(a).toBeGreaterThan(b);
    expect(a).toBeLessThanOrEqual(100);
    expect(b).toBeGreaterThanOrEqual(0);
  });
  it("ranks and sorts branches", () => {
    const items = [
      { code: "B", performanceIndex: 50, current: weak },
      { code: "A", performanceIndex: 80, current: strong },
      { code: "C", performanceIndex: 80, current: strong },
    ];
    const ranks = rankByPerformance(items);
    expect(ranks.get("A")).toBe(1);
    expect(ranks.get("C")).toBe(1);
    expect(ranks.get("B")).toBe(3);
    expect(sortBranches(items, "sales").map((i) => i.code)).toEqual(["A", "C", "B"]);
    expect(sortBranches(items, "sales", "asc")[0]!.code).toBe("B");
    expect(sortBranches(items, "expiry")[0]!.code).toBe("A");
    expect(sortBranches(items, "code").map((i) => i.code)).toEqual(["A", "B", "C"]);
  });
});

describe("aggregation", () => {
  it("weights achievement by target, not by branch count", () => {
    const a = deriveMetrics(raw({ salesTarget: 1_000_000, salesActual: 1_100_000 }), 96);
    const b = deriveMetrics(raw({ salesTarget: 100_000, salesActual: 50_000 }), 96);
    const agg = aggregate([a, b]);
    expect(agg.achievement).toBeCloseTo((1_150_000 / 1_100_000) * 100);
    expect(agg.salesActual).toBe(1_150_000);
    expect(agg.count).toBe(2);
  });
  it("returns zeros for an empty set", () => {
    expect(aggregate([]).achievement).toBe(0);
  });
  it("computes weighted means and medians", () => {
    expect(weightedMean([{ value: 10, weight: 1 }, { value: 20, weight: 3 }])).toBe(17.5);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
  });
});

describe("attention & strengths", () => {
  it("flags weak indicators and decides attention", () => {
    const d: DerivedMetrics = deriveMetrics(raw({ salesActual: 400_000, complianceScore: 85 }), 97);
    const flags = attentionFlags(d);
    expect(flags.map((f) => f.indicator)).toEqual(expect.arrayContaining(["achievement", "complianceScore"]));
    expect(attentionScore(flags)).toBe(4);
    expect(needsAttention(flags)).toBe(true);
    expect(needsAttention(attentionFlags(deriveMetrics(raw(), 97)))).toBe(false);
  });
  it("derives strengths relative to the area average", () => {
    const d = deriveMetrics(raw(), 97);
    const area = { achievement: 95, stockAvailability: 97, complianceScore: 88, slowMovingPct: 10, nearExpiryPct: 3, attendanceRate: 95, customerSatisfaction: 85 };
    const { strengths, opportunities } = strengthsAndOpportunities(d, area);
    expect(strengths).toContain("achievement");
    expect(strengths).toContain("nearExpiryPct");
    expect(strengths).not.toContain("stockAvailability"); // good but below area average
    expect(opportunities).toEqual([]);
  });
});

describe("employee summaries", () => {
  it("bands scores and experience", () => {
    expect(performanceBand(92)).toBe("exceptional");
    expect(performanceBand(80)).toBe("strong");
    expect(performanceBand(59)).toBe("below");
    expect(experienceBand(0)).toBe("0-2");
    expect(experienceBand(5)).toBe("3-5");
    expect(experienceBand(10)).toBe("6-10");
    expect(experienceBand(11)).toBe("11+");
  });
  it("summarises a team", () => {
    const s = summariseEmployeePerformance([
      { id: "a", score: 95 },
      { id: "b", score: 60 },
      { id: "c", score: 72 },
    ], 2);
    expect(s.average).toBeCloseTo(75.67, 1);
    expect(s.topPerformerIds).toEqual(["a", "c"]);
    expect(s.needsSupportIds).toEqual(["b"]);
    expect(s.distribution.exceptional).toBe(1);
  });
});
