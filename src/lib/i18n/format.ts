/**
 * Locale-aware number and date formatting.
 * Arabic uses Latin digits and the Gregorian calendar for dashboard legibility.
 */
import type { Locale } from "@/domain/common";

const tag = (locale: Locale) => (locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB");

export function formatNumber(value: number, locale: Locale, digits = 0): string {
  return new Intl.NumberFormat(tag(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function formatPercent(value: number, locale: Locale, digits = 1): string {
  return `${formatNumber(value, locale, digits)}%`;
}

export function formatSignedPercent(value: number, locale: Locale, digits = 1): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatNumber(Math.abs(value), locale, digits)}%`;
}

export function formatCurrency(value: number, locale: Locale, compact = false): string {
  const n = new Intl.NumberFormat(tag(locale), {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);
  return locale === "ar" ? `${n} ر.س` : `SAR ${n}`;
}

export function formatSignedCurrency(value: number, locale: Locale, compact = false): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatCurrency(Math.abs(value), locale, compact)}`;
}

export function formatDate(iso: string, locale: Locale, style: "long" | "medium" | "short" = "medium"): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  const opts: Intl.DateTimeFormatOptions =
    style === "long"
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
      : style === "medium"
        ? { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }
        : { day: "numeric", month: "short", timeZone: "UTC" };
  return new Intl.DateTimeFormat(tag(locale), opts).format(d);
}

export function formatMonth(iso: string, locale: Locale, short = false): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return new Intl.DateTimeFormat(tag(locale), { month: short ? "short" : "long", year: short ? "2-digit" : "numeric", timeZone: "UTC" }).format(d);
}

export function formatWeekday(iso: string, locale: Locale): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return new Intl.DateTimeFormat(tag(locale), { weekday: "short", timeZone: "UTC" }).format(d);
}
