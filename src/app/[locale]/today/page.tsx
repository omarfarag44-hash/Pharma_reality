import Link from "next/link";
import { CalendarCheck, CheckCircle2, Coffee, Flag, GraduationCap, RotateCcw, Sparkles } from "lucide-react";
import { getSimulation } from "@/data/repository";
import { fmt } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/format";
import { pageContext } from "@/lib/page";
import { endDay, resetSimulation } from "@/lib/simulation/actions";
import { addDaysIso } from "@/lib/simulation/calendar";
import { isWeekend } from "@/lib/simulation/engine";
import { leadershipDna } from "@/lib/simulation/leadership";
import { getSimIndex, scenarioView } from "@/services/simulation-service";
import { ScenarioCard } from "@/components/simulation/scenario-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function TodayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, repo } = await pageContext(params);
  const t = dict.sim;
  const [run, idx] = await Promise.all([getSimulation(), getSimIndex(repo)]);
  const { state, world } = run;
  const date = addDaysIso(world.startDate, state.day - 1);
  const views = run.today.map((inst) => scenarioView(run, inst, idx, locale));
  const pending = views.filter((v) => !v.decision);
  const decided = views.filter((v) => v.decision);
  const dna = leadershipDna(state);
  const activePlans = state.coaching.filter((c) => c.status === "active");
  const weekend = isWeekend(world, state.day);
  const isLastDay = state.day === world.lengthDays;

  return (
    <>
      <PageHeader
        eyebrow={<span data-testid="today-day">{fmt(t.dayOf, { n: state.day, total: world.lengthDays })}</span>}
        title={state.completed ? t.completedTitle : `${t.todayTitle} · ${formatDate(date, locale, "long")}`}
        description={state.completed ? t.completedBody : t.todaySubtitle}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile testId="today-pending" label={t.pendingTitle} value={pending.length} icon={<Flag />} />
        <StatTile label={t.madeDecisions} value={dna.decisions} detail={`${t.ignoredDecisions}: ${dna.ignored}`} icon={<CheckCircle2 />} />
        <StatTile
          label={t.style}
          value={<span className="text-base leading-snug">{dna.style ? t.styles[dna.style as keyof typeof t.styles].split(":")[0] : "—"}</span>}
          detail={<Link href={`/${locale}/leadership`} className="hover:underline">{t.viewDna}</Link>}
          icon={<Sparkles />}
        />
        <StatTile
          label={dict.calendar.progress}
          value={`${Math.round(((state.completed ? world.lengthDays : state.day - 1) / world.lengthDays) * 100)}%`}
          detail={<Progress value={Math.max(((state.completed ? world.lengthDays : state.day - 1) / world.lengthDays) * 100, 1.1)} />}
          icon={<CalendarCheck />}
        />
      </section>

      {state.completed ? (
        <Card className="mt-6" data-testid="simulation-complete">
          <CardContent className="flex flex-col items-start gap-3 text-sm">
            <p>{t.completedBody}</p>
            <Button asChild>
              <Link href={`/${locale}/leadership`}>{t.viewDna}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {weekend && (
            <Card className="mt-6" data-testid="weekend">
              <CardHeader className="flex-row items-center gap-2">
                <Coffee className="text-muted-foreground size-5" aria-hidden />
                <CardTitle>{t.weekendTitle}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{t.weekendBody}</CardContent>
            </Card>
          )}

          {pending.length > 0 && (
            <section className="mt-6" aria-labelledby="pending-heading">
              <h2 id="pending-heading" className="mb-3 text-lg font-semibold">{t.pendingTitle}</h2>
              <div className="grid gap-4 xl:grid-cols-2">
                {pending.map((v) => <ScenarioCard key={v.id} view={v} dict={dict} locale={locale} interactive />)}
              </div>
            </section>
          )}

          {!weekend && pending.length === 0 && (
            <p className="bg-good-soft text-good mt-6 rounded-lg px-4 py-3 text-sm font-medium" data-testid="all-handled">{t.nothingPending}</p>
          )}

          <Card className="mt-6">
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                {pending.length > 0 ? (
                  <span className="text-[oklch(0.45_0.11_65)]" data-testid="end-day-warning">{fmt(t.endDayWarning, { n: pending.length })}</span>
                ) : (
                  <span className="text-muted-foreground">{formatDate(date, locale, "long")}</span>
                )}
              </div>
              <form action={endDay}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="day" value={state.day} />
                <Button type="submit" size="lg" className="w-full sm:w-auto" data-testid="end-day">
                  {isLastDay ? t.endDayLast : fmt(t.endDay, { n: state.day })}
                </Button>
              </form>
            </CardContent>
          </Card>

          {decided.length > 0 && (
            <section className="mt-6" aria-labelledby="decided-heading">
              <h2 id="decided-heading" className="mb-3 text-lg font-semibold">{t.resolvedTitle}</h2>
              <div className="grid gap-4 xl:grid-cols-2">
                {decided.map((v) => <ScenarioCard key={v.id} view={v} dict={dict} locale={locale} interactive={false} />)}
              </div>
            </section>
          )}
        </>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><GraduationCap className="size-4" aria-hidden />{t.activePlans}</CardTitle>
            <Link href={`/${locale}/coaching`} className="text-primary text-xs hover:underline">{t.coachingTitle}</Link>
          </CardHeader>
          <CardContent className="text-sm">
            {activePlans.length === 0 ? (
              <p className="text-muted-foreground">{t.noPlans}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {activePlans.map((p) => {
                  const leader = idx.employees.get(p.leaderId);
                  return (
                    <li key={p.branchId} className="flex items-center justify-between gap-2">
                      <span className="truncate">{leader?.fullName[locale]} · {t.focusLabel[p.focus]}</span>
                      <Badge variant="secondary">{fmt(t.planDays, { a: p.startDay, b: p.endDay })}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RotateCcw className="size-4" aria-hidden />{t.reset}</CardTitle>
            <CardDescription>{t.resetHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <details>
              <summary className="text-muted-foreground cursor-pointer text-sm">{t.reset}</summary>
              <form action={resetSimulation} className="mt-3">
                <input type="hidden" name="locale" value={locale} />
                <Button type="submit" variant="outline" data-testid="reset-simulation">{t.resetConfirm}</Button>
              </form>
            </details>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
