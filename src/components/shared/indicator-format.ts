import type { Locale } from "@/domain/common";
import type { IndicatorKey } from "@/lib/analytics";
import { formatNumber, formatPercent } from "@/lib/i18n/format";

export function formatIndicator(key: IndicatorKey, value: number, locale: Locale): string {
  if (key === "customerSatisfaction") return `${formatNumber(value, locale, 1)} / 100`;
  return formatPercent(value, locale, 1);
}

/** Meter scale per indicator, so bars are comparable to thresholds. */
export const INDICATOR_SCALE: Record<IndicatorKey, { min: number; max: number }> = {
  achievement: { min: 60, max: 120 },
  stockAvailability: { min: 80, max: 100 },
  complianceScore: { min: 50, max: 100 },
  slowMovingPct: { min: 0, max: 30 },
  nearExpiryPct: { min: 0, max: 10 },
  attendanceRate: { min: 85, max: 100 },
  customerSatisfaction: { min: 50, max: 100 },
};
