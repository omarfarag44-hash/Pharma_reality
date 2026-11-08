import type { ReactNode } from "react";
import { Database, FlaskConical, LogOut } from "lucide-react";
import type { Locale } from "@/domain/common";
import type { Dictionary } from "@/lib/i18n";
import type { DataMode } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { BrandMark } from "./brand";
import { LanguageSwitch } from "./language-switch";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";

interface Props {
  locale: Locale;
  dict: Dictionary;
  mode: DataMode;
  modeWarning?: string;
  simulation: { currentDay: number; lengthDays: number; currentDate: string } | null;
  children: ReactNode;
}

export function AppShell({ locale, dict, mode, modeWarning, simulation, children }: Props) {
  const modeLabel = mode === "demo" ? dict.common.demoMode : mode === "supabase" ? dict.common.supabaseMode : dict.common.postgresMode;
  const modeHint = mode === "demo" ? dict.common.demoModeHint : mode === "supabase" ? dict.common.supabaseModeHint : dict.common.postgresModeHint;
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-card focus:px-3 focus:py-2">
        {dict.nav.skipToContent}
      </a>
      <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-dvh flex-col gap-6 p-4 lg:flex">
        <BrandMark dict={dict} />
        <SidebarNav locale={locale} nav={dict.nav} />
        <p className="text-sidebar-muted mt-auto text-[11px] leading-relaxed">{dict.common.fictional}</p>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="bg-background/90 sticky top-0 z-30 border-b backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-4 sm:gap-3 lg:px-8">
            <MobileNav locale={locale} dict={dict} />
            {simulation && (
              <div className="flex min-w-0 items-center gap-2 text-sm" data-testid="simulation-day">
                <span className="bg-primary text-primary-foreground rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
                  {dict.common.day} {simulation.currentDay} {dict.common.of} {simulation.lengthDays}
                </span>
                <span className="text-muted-foreground hidden truncate sm:inline">{formatDate(simulation.currentDate, locale, "long")}</span>
              </div>
            )}
            <div className="ms-auto flex items-center gap-2">
              <span
                title={modeWarning ?? modeHint}
                data-testid="data-mode"
                data-mode={mode}
                className={
                  mode === "demo"
                    ? "bg-watch-soft text-[oklch(0.45_0.11_65)] inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
                    : "bg-good-soft text-good inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
                }
              >
                {mode === "demo" ? <FlaskConical className="size-3.5" aria-hidden /> : <Database className="size-3.5" aria-hidden />}
                <span className="hidden sm:inline">{modeLabel}</span>
                <span className="sr-only sm:hidden">{modeLabel}</span>
              </span>
              <LanguageSwitch locale={locale} label={dict.common.language} ariaLabel={dict.common.languageLabel} />
              {mode === "supabase" && (
                <form action={signOut}>
                  <input type="hidden" name="locale" value={locale} />
                  <Button type="submit" variant="ghost" size="icon" aria-label={dict.login.signOut} title={dict.login.signOut}>
                    <LogOut />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </header>
        {mode === "demo" && (
          <div className="bg-watch-soft/60 border-b px-4 py-1.5 text-xs text-[oklch(0.42_0.09_65)] lg:px-8" role="note">
            <strong className="font-semibold">{dict.common.demoMode}:</strong> {modeWarning ?? dict.common.demoModeHint}
          </div>
        )}
        <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
