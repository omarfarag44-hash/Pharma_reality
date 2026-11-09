import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getSimulation } from "@/data/repository";
import { fmt } from "@/lib/i18n";
import { pageContext } from "@/lib/page";
import { startCoaching } from "@/lib/simulation/actions";
import { COACHING_DAYS, MAX_ACTIVE_COACHING, trustOf } from "@/lib/simulation/engine";
import { COACHING_FOCUS } from "@/lib/simulation/types";
import { getSimIndex } from "@/services/simulation-service";
import { TrustValue } from "@/components/simulation/scenario-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";

export default async function CoachingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, repo } = await pageContext(params);
  const t = dict.sim;
  const [run, idx] = await Promise.all([getSimulation(), getSimIndex(repo)]);
  const { state, world } = run;
  const active = state.coaching.filter((c) => c.status === "active");
  const completed = state.coaching.filter((c) => c.status === "completed");
  const busy = new Set(active.map((c) => c.branchId));
  const available = world.branches.filter((b) => !busy.has(b.id));
  const full = active.length >= MAX_ACTIVE_COACHING;

  const planRow = (p: (typeof state.coaching)[number]) => {
    const leader = idx.employees.get(p.leaderId);
    const branch = idx.branches.get(p.branchId);
    const doneDays = Math.min(COACHING_DAYS, Math.max(0, state.day - p.startDay));
    return (
      <li key={`${p.branchId}-${p.startDay}`} className="flex flex-col gap-1.5 rounded-lg border p-3 text-sm" data-testid="coaching-plan" data-status={p.status}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {leader && <Link href={`/${locale}/people/${leader.id}`} className="font-medium hover:underline">{leader.fullName[locale]}</Link>}
          <Badge variant={p.status === "active" ? "secondary" : "good"}>{t.planStatus[p.status]}</Badge>
        </div>
        <div className="text-muted-foreground text-xs">
          {branch && <Link href={`/${locale}/branches/${branch.code}`} className="ltr-nums hover:underline">{branch.code}</Link>} · {t.focusLabel[p.focus]} · {fmt(t.planDays, { a: p.startDay, b: p.endDay })}
        </div>
        <Progress value={p.status === "completed" ? 100 : (doneDays / COACHING_DAYS) * 100} />
      </li>
    );
  };

  return (
    <>
      <PageHeader title={t.coachingTitle} description={t.coachingSubtitle} />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="size-4" aria-hidden />{t.newPlan}</CardTitle>
            <CardDescription>{fmt(t.planLimit, { n: MAX_ACTIVE_COACHING })}</CardDescription>
          </CardHeader>
          <CardContent>
            {state.completed ? (
              <p className="text-muted-foreground text-sm">{t.completedTitle}</p>
            ) : full ? (
              <p className="text-sm" data-testid="coaching-full">{fmt(t.planFull, { n: MAX_ACTIVE_COACHING })}</p>
            ) : (
              <form action={startCoaching} className="flex flex-col gap-3" data-testid="coaching-form">
                <input type="hidden" name="locale" value={locale} />
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted-foreground text-xs font-medium">{t.leader}</span>
                  <NativeSelect name="branch" required defaultValue={available[0]?.code}>
                    {available.map((b) => {
                      const leader = idx.employees.get(b.leaderId);
                      return (
                        <option key={b.code} value={b.code}>
                          {b.code} · {leader?.fullName[locale]} ({t.trustInYou} {trustOf(world, state, b.leaderId)})
                        </option>
                      );
                    })}
                  </NativeSelect>
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted-foreground text-xs font-medium">{t.focus}</span>
                  <NativeSelect name="focus" required defaultValue="stock">
                    {COACHING_FOCUS.map((f) => <option key={f} value={f}>{t.focusLabel[f]}</option>)}
                  </NativeSelect>
                </label>
                <Button type="submit" data-testid="coaching-start">{t.startPlan}</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-3">
          <Card>
            <CardHeader><CardTitle>{t.activePlans}</CardTitle></CardHeader>
            <CardContent>
              {active.length ? <ul className="flex flex-col gap-2">{active.map(planRow)}</ul> : <p className="text-muted-foreground text-sm">{t.noPlans}</p>}
            </CardContent>
          </Card>
          {completed.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{t.completedPlans}</CardTitle></CardHeader>
              <CardContent><ul className="flex flex-col gap-2">{completed.map(planRow)}</ul></CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle>{t.leader}</CardTitle></CardHeader>
            <CardContent>
              <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
                {world.branches.map((b) => {
                  const leader = idx.employees.get(b.leaderId);
                  return (
                    <li key={b.id} className="flex items-center justify-between gap-2">
                      <span className="truncate"><span className="ltr-nums text-muted-foreground text-xs">{b.code}</span> {leader?.fullName[locale]}</span>
                      <span className="text-muted-foreground shrink-0 text-xs">{t.trustInYou} <TrustValue value={trustOf(world, state, b.leaderId)} /></span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
