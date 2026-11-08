import "server-only";
import { notFound } from "next/navigation";
import { getRepository } from "@/data/repository";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

/** Resolves locale, dictionary and repository for a page. */
export async function pageContext(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale as Locale);
  const repo = await getRepository();
  return { locale: locale as Locale, dict, repo };
}
