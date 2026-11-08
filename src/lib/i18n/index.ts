import { LOCALES, type Locale, type LocalizedText } from "@/domain/common";
import { ar } from "./dictionaries/ar";
import { en, type Dictionary } from "./dictionaries/en";

export const DEFAULT_LOCALE: Locale = "ar";
export { LOCALES };
export type { Dictionary, Locale };

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Picks the right language from a bilingual value. */
export function tx(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

/** Simple {placeholder} interpolation. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? `{${k}}`));
}
