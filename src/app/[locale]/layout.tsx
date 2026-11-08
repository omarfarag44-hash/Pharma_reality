import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { getRepository } from "@/data/repository";
import { resolveEnv } from "@/lib/env";
import { dirOf, getDictionary, isLocale } from "@/lib/i18n";
import { buildCalendar } from "@/lib/simulation/calendar";
import "../globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-arabic", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// Data comes from the active source on every request (Supabase/Postgres data must never be frozen at build time).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : "ar");
  return {
    title: { default: `${dict.meta.product} · NEXUS`, template: `%s · ${dict.meta.product}` },
    description: dict.meta.description,
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { themeColor: "#1f2a33", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const env = resolveEnv();

  let simulation: { currentDay: number; lengthDays: number; currentDate: string } | null = null;
  try {
    const repo = await getRepository();
    const session = await repo.getSimulationSession();
    const cal = buildCalendar(session);
    simulation = { currentDay: session.currentDay, lengthDays: session.lengthDays, currentDate: cal.currentDate };
  } catch {
    // Data-source problems are reported by the page-level error boundary.
  }

  return (
    <html lang={locale} dir={dirOf(locale)} className={`${plexArabic.variable} ${inter.variable}`}>
      <body>
        <AppShell locale={locale} dict={dict} mode={env.mode} modeWarning={env.warning} simulation={simulation}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
