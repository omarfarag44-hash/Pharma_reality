import type { DataProvenance, LocalizedText, MonthKey } from "./common";

export const PERFORMANCE_GROUPS = ["A", "B", "C"] as const;
export type PerformanceGroup = (typeof PERFORMANCE_GROUPS)[number];

export const BRANCH_CATEGORIES = ["flagship", "mall", "community", "medical", "highway"] as const;
export type BranchCategory = (typeof BRANCH_CATEGORIES)[number];

export const ZONES = ["riyadh_north", "riyadh_central_west", "riyadh_south_kharj"] as const;
export type Zone = (typeof ZONES)[number];

export interface Branch {
  id: string;
  /** Unique branch code such as NX-C01. */
  code: string;
  /** 1..15 within the player's region. */
  number: number;
  name: LocalizedText;
  regionId: string;
  city: LocalizedText;
  district: LocalizedText;
  zone: Zone;
  performanceGroup: PerformanceGroup;
  category: BranchCategory;
  openedYear: number;
  areaSqm: number;
  is24Hours: boolean;
  /** Short qualitative backstory that explains the numbers. */
  context: LocalizedText;
}

/**
 * Monthly operating figures. Stored figures are raw facts only;
 * ratios such as achievement or basket value are always derived by the analytics engine.
 */
export interface MonthlyMetrics {
  month: MonthKey;
  salesTarget: number;
  salesActual: number;
  /** Customer transactions (customer count) in the month. */
  transactions: number;
  /** % of core SKUs in stock at month end. */
  stockAvailability: number;
  /** Inventory value held at month end (SAR). */
  inventoryValue: number;
  /** Inventory value with no sale in 90+ days (SAR). */
  slowMovingValue: number;
  /** Inventory value expiring within 90 days (SAR). */
  nearExpiryValue: number;
  /** Operational compliance audit score (0–100). */
  complianceScore: number;
  /** Customer satisfaction (0–100 CSAT). */
  customerSatisfaction: number;
  provenance: DataProvenance;
}

export interface BranchMetricRecord extends MonthlyMetrics {
  id: string;
  branchId: string;
}

/** Summarised monthly figures for peer regions whose branches are not modelled individually. */
export interface RegionMetricRecord {
  id: string;
  regionId: string;
  month: MonthKey;
  salesTarget: number;
  salesActual: number;
  transactions: number;
  stockAvailability: number;
  complianceScore: number;
  customerSatisfaction: number;
  provenance: DataProvenance;
}
