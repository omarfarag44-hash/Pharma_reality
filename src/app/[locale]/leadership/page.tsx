import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getSimulation } from "@/data/repository";
import { fmt } from "@/lib/i18n";
import { pageContext } from "@/lib/page";
import { DNA_MIN_DECISIONS, leadershipDna } from "@/lib/simulation/leadership";
import { DNA_DIMENSIONS } from "@/lib/simulation/types";
import { decisionLog, getSimIndex } from "@/services/simulation-service";
import { leadershipMoments, slSummary, SL_MIN_MOMENTS } from "@/services/report-service";
import { LeadershipMomentItem } from "@/components/simulation/leadership-moment";
import { EffectList } from "@/components/simulation/scenario-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default async function LeadershipPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, repo } = await pageContext(params);
  const t = dict.sim;
  const [run, idx] = await Promise.all([getSimulation(), getSimIndex(repo)]);
  const dna = leadershipDna(run.state);
  const log = decisionLog(run, idx, locale);
  const styleKey = dna.style as keyof typeof t.styles | null;
  const sl = dict.sl;
  const summary = slSummary(run);
  const moments = leadershipMoments(run, idx, locale, dict).filter((m) => m.style !== null).slice(0, 8);

  return (
    <>
      <PageHeader title={t.dnaTitle} description={t.dnaSubtitle} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile testId="dna-decisions" label={t.madeDecisions} value={dna.decisions} />
        <StatTile label={t.ignoredDecisions} value={dna.ignored} />
        <StatTile label={t.dominant} value={<span className="text-base">{dna.dominant ? t.dims[dna.dominant] : "—"}</span>} />
        <StatTile label={t.weakest} value={<span className="text-base">{dna.weakest ? t.dims[dna.weakest] : "—"}</span>} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2" data-testid="dna-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="size-4" aria-hidden />{t.style}</CardTitle>
            <CardDescription data-testid="dna-style">{styleKey ? t.styles[styleKey] : fmt(t.dnaForming, { n: DNA_MIN_DECISIONS })}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {DNA_DIMENSIONS.map((d) => (
                <li key={d} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm" data-testid="dna-dimension" data-dimension={d}>
                  <span className={cn(dna.dominant === d && "font-semibold")}>{t.dims[d]}</span>
                  <span className="tabular-nums">{dna.scores[d]}</span>
                  <div className="col-span-2">
                    <Progress value={dna.scores[d]} indicatorClassName={dna.scores[d] >= 60 ? "bg-good" : dna.scores[d] < 40 ? "bg-critical" : "bg-primary"} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t.logTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {log.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t.logEmpty} <Link href={`/${locale}/today`} className="text-primary hover:underline">{t.openToday}</Link>
              </p>
            ) : (
              <ul className="flex flex-col divide-y" data-testid="decision-log">
                {log.map((v) => (
                  <li key={v.id} className="py-2">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <Badge variant="muted">{dict.common.day} {v.day}</Badge>
                        <span className="font-medium">{v.title}</span>
                        <span className={cn("text-xs", v.decision?.label ? "text-muted-foreground" : "text-critical")}>· {v.decision?.label ?? t.ignoredLabel}</span>
                      </summary>
                      <div className="bg-muted/50 mt-2 flex flex-col gap-2 rounded-lg p-3 text-sm">
                        <p>{v.decision?.outcome}</p>
                        {v.decision && <EffectList effects={v.decision.effects} dict={dict} />}
                        {Object.keys(v.dna).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(v.dna).map(([k, pts]) => (
                              <Badge key={k} variant={(pts ?? 0) > 0 ? "good" : (pts ?? 0) < 0 ? "critical" : "muted"}>
                                {t.dims[k as keyof typeof t.dims]} <span dir="ltr">{(pts ?? 0) > 0 ? `+${pts}` : pts}</span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6" data-testid="sl-summary">
        <CardHeader>
          <CardTitle>{sl.slTitle}</CardTitle>
          <CardDescription>{sl.slSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 text-sm">
          {summary.moments === 0 ? (
            <p className="text-muted-foreground" data-testid="sl-empty">{sl.slEmpty}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile testId="sl-moments" label={sl.moments} value={summary.moments} />
                <StatTile testId="sl-match" label={sl.matchRate} value={`${summary.matchRate}%`} />
                <StatTile label={sl.overDirecting} value={summary.overDirecting} />
                <StatTile label={sl.underSupporting} value={summary.underSupporting} />
              </div>
              <p className="bg-muted/50 rounded-lg p-3" data-testid="sl-pattern" data-pattern={summary.pattern}>
                {summary.pattern === "forming" ? fmt(sl.pattern.forming, { n: SL_MIN_MOMENTS }) : sl.pattern[summary.pattern]}
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="text-muted-foreground mb-2 text-xs font-medium">{sl.byWeek}</h3>
                  <ul className="flex flex-col gap-2">
                    {summary.byWeek.map((w) => (
                      <li key={w.week} className="grid grid-cols-[5rem_1fr_3rem] items-center gap-2 text-xs">
                        <span>{fmt(sl.week, { n: w.week })}</span>
                        <Progress value={Math.max(w.matchRate, 1)} indicatorClassName={w.matchRate >= 60 ? "bg-good" : w.matchRate < 35 ? "bg-critical" : "bg-primary"} />
                        <span className="text-end tabular-nums" dir="ltr">{w.matchRate}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-muted-foreground mb-2 text-xs font-medium">{sl.byLevel}</h3>
                  <ul className="flex flex-col gap-1.5 text-xs">
                    {summary.byLevel.filter((l) => l.moments > 0).map((l) => (
                      <li key={l.level} className="flex items-center justify-between gap-2">
                        <span>{sl.levelName[l.level]}</span>
                        <span className="tabular-nums" dir="ltr">{l.matched}/{l.moments}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <ul className="flex flex-col gap-3" data-testid="sl-moments-list">
                {moments.map((m, i) => <LeadershipMomentItem key={i} m={m} dict={dict} locale={locale} showDay />)}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
