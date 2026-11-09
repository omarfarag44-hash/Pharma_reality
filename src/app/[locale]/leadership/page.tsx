import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getSimulation } from "@/data/repository";
import { fmt } from "@/lib/i18n";
import { pageContext } from "@/lib/page";
import { DNA_MIN_DECISIONS, leadershipDna } from "@/lib/simulation/leadership";
import { DNA_DIMENSIONS } from "@/lib/simulation/types";
import { decisionLog, getSimIndex } from "@/services/simulation-service";
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
    </>
  );
}
