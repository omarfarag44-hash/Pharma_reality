/**
 * Shared primitives used across every domain module.
 */

export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Bilingual text. Every user-facing record in PHARMA REALITY carries both languages. */
export interface LocalizedText {
  en: string;
  ar: string;
}

/**
 * Where a number came from. The UI must always be able to tell these apart.
 *
 * - synthetic_historical: generated backstory before the simulation starts (seeded, deterministic)
 * - simulated_current:    the opening position on simulation Day 1 (seeded, deterministic)
 * - scenario_generated:   produced by future simulation engines (not used in Sprint 1)
 */
export const DATA_PROVENANCE = [
  "synthetic_historical",
  "simulated_current",
  "scenario_generated",
] as const;
export type DataProvenance = (typeof DATA_PROVENANCE)[number];

/** ISO calendar date, e.g. "2027-01-03". */
export type ISODate = string;

/** First day of a month, e.g. "2026-12-01". Used as the period key for monthly metrics. */
export type MonthKey = string;

export type Gender = "male" | "female";

export type IndicatorStatus = "good" | "watch" | "critical";
