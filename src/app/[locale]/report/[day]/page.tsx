import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardList, HeartHandshake, ListTodo, Sparkles, Target, Users } from "lucide-react";
import { getSimulation } from "@/data/repository";
import { fmt } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/format";
import { pageContext } from "@/lib/page";
import { addDaysIso } from "@/lib/simulation/calendar";
import { getBranchSummaries } from "@/services/branch-service";
import { dayReport, type Change } from "@/services/report-service";
import { getSimIndex } from "@/services/simulation-service";
import { LeadershipMomentItem } from "@/components/simulation/leadership-moment";
import { ScenarioCard, TrustValue } from "@/components/simulation/scenario-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Delta({ c, label }: { c: Change | null; label: string }) {
  if (!c || c.before === c.after) return null;
  const up = c.after > c.before;
  return (
    <span className="text-xs">
      <span className="text-muted-foreground">{label}: </span>
      <span dir="ltr" className="tabular-nums">
        {c.before} → <strong className={up ? "text-good" : "text-critical"}>{c.after}</strong>
      </span>
    </span>
  );
}

export default async function ReportPage({ params }: { params: Promise<{ locale: string; day: string }> }) {
  const { day: raw } = await params;
  const { locale, dict, repo } = await pageContext(params);
  const day = Number(raw);
  const [run, idx] = await Promise.all([getSimulation(), getSimIndex(repo)]);
  const { state, world } = run;
  if (!Number.isInteger(day) || day < 1 || day > world.lengthDays) notFound();
  const s = dict.sl;
  const report = dayReport(run, day, idx, locale, dict);
  const date = addDaysIso(world.startDate, day - 1);
  const latestClosed = report.closed && (day === state.day - 1 || (state.completed && day === world.lengthDays));
  const priorities = latestClosed ? (await getBranchSummaries(repo)).filter((b) => b.needsAttention).sort((a, b) => b.attentionScore - a.attentionScore).slice(0, 4) : [];
  const Prev = locale === "ar" ? ArrowRight : ArrowLeft;
  const Next = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <>
      <PageHeader
        eyebrow={formatDate(date, locale, "long")}
        title={fmt(s.reportTitle, { n: day })}
        description={s.reportSubtitle}
      />

      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        {day > 1 && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/report/${day - 1}`}><Prev className="size-4" aria-hidden />{s.previousDay}</Link>
          </Button>
        )}
        {report.closed && day + 1 < state.day && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/report/${day + 1}`}>{s.nextDay}<Next className="size-4" aria-hidden /></Link>
          </Button>
        )}
        <Button asChild size="sm" className="ms-auto">
          <Link href={`/${locale}/today`}>{s.backToToday}</Link>
        </Button>
      </nav>

      {!report.closed ? (
        <Card data-testid="report-not-closed">
          <CardContent className="text-sm">{s.reportNotClosed}</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6" data-testid="day-report">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="size-4" aria-hidden />{s.leadershipSection}</CardTitle>
            </CardHeader>
            <CardContent>
              {report.leadership.length === 0 ? (
                <p className="text-muted-foreground text-sm">{s.leadershipEmpty}</p>
              ) : (
                <ul className="flex flex-col gap-3" data-testid="report-leadership">
                  {report.leadership.map((m, i) => <LeadershipMomentItem key={i} m={m} dict={dict} locale={locale} />)}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="size-4" aria-hidden />{s.peopleSection}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {report.people.length === 0 ? (
                  <p className="text-muted-foreground">{s.peopleEmpty}</p>
                ) : (
                  <ul className="flex flex-col divide-y" data-testid="report-people">
                    {report.people.map((p) => (
                      <li key={p.employee.id} className="flex flex-col gap-0.5 py-2">
                        <Link href={`/${locale}/people/${p.employee.id}`} className="font-medium hover:underline">{p.employee.fullName[locale]}</Link>
                        <div className="flex flex-wrap gap-x-4">
                          <Delta c={p.trust} label={s.trustLabel} />
                          <Delta c={p.commitment} label={s.commitmentLabel} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><HeartHandshake className="size-4" aria-hidden />{s.relationsSection}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {report.relations.length === 0 ? (
                  <p className="text-muted-foreground">{s.relationsEmpty}</p>
                ) : (
                  <ul className="flex flex-col divide-y" data-testid="report-relations">
                    {report.relations.map((r) => (
                      <li key={`${r.a.id}|${r.b.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span>
                          <Link href={`/${locale}/people/${r.a.id}`} className="hover:underline">{r.a.fullName[locale]}</Link>
                          {" ↔ "}
                          <Link href={`/${locale}/people/${r.b.id}`} className="hover:underline">{r.b.fullName[locale]}</Link>
                        </span>
                        <span dir="ltr" className="text-xs tabular-nums">
                          <TrustValue value={r.change.before} /> → <strong className={r.change.after > r.change.before ? "text-good" : "text-critical"}>{r.change.after}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListTodo className="size-4" aria-hidden />{s.followUpsSection}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {report.followUps.length + report.plans.length === 0 ? (
                  <p className="text-muted-foreground">{s.followUpsEmpty}</p>
                ) : (
                  <ul className="flex list-disc flex-col gap-1 ps-5" data-testid="report-followups">
                    {report.plans.map((p, i) => (
                      <li key={`p${i}`}>{fmt(s.planOpen, { name: p.leader?.fullName[locale] ?? "", focus: p.focus, d: p.endDay })}</li>
                    ))}
                    {report.followUps.map((f, i) => <li key={`f${i}`}>{f}</li>)}
                  </ul>
                )}
              </CardContent>
            </Card>

            {latestClosed && !state.completed && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Target className="size-4" aria-hidden />{s.prioritiesSection}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {priorities.length === 0 ? (
                    <p className="text-muted-foreground">{s.prioritiesEmpty}</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5" data-testid="report-priorities">
                      {priorities.map((b) => (
                        <li key={b.code}>
                          <Link href={`/${locale}/branches/${b.code}`} className="hover:underline">
                            {fmt(s.priority, {
                              branch: `${b.code} · ${b.branch.name[locale]}`,
                              issues: b.flags.map((f) => dict.indicators[f.indicator]).join(locale === "ar" ? "، " : ", "),
                            })}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <section aria-labelledby="report-decisions">
            <h2 id="report-decisions" className="mb-3 flex items-center gap-2 text-lg font-semibold"><ClipboardList className="size-5" aria-hidden />{s.decisionsSection}</h2>
            {report.scenarios.length === 0 ? (
              <p className="text-muted-foreground text-sm">{s.noDecisionsThatDay}</p>
            ) : (
              <div className={cn("grid gap-4", report.scenarios.length > 1 && "xl:grid-cols-2")}>
                {report.scenarios.map((v) => <ScenarioCard key={v.id} view={v} dict={dict} locale={locale} interactive={false} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
