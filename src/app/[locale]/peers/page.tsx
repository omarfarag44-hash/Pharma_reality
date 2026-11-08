import { COMPETENCIES, LEADERSHIP_STYLES, catalogLabel, COMMUNICATION_STYLE_SHORT } from "@/domain/catalogs";
import { classify } from "@/lib/analytics";
import { formatCurrency, formatMonth, formatPercent } from "@/lib/i18n/format";
import { pageContext } from "@/lib/page";
import { getPeerSupervisors } from "@/services/org-service";
import { SingleLineChart } from "@/components/charts/charts";
import { PageHeader } from "@/components/shared/page-header";
import { PersonLink } from "@/components/shared/person-link";
import { StatusBadge, TrendIndicator } from "@/components/shared/status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function PeersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, repo } = await pageContext(params);
  const peers = await getPeerSupervisors(repo);
  const t = dict.peers;
  return (
    <>
      <PageHeader title={t.title} description={`${t.subtitle} ${t.summaryNote}`} />
      <ul className="grid gap-6 xl:grid-cols-3" data-testid="peer-list">
        {peers.map(({ employee: e, profile: p, performance: perf, relationship: r }) => (
          <li key={e.id} data-testid="peer-card">
            <Card className="h-full">
              <CardHeader>
                <PersonLink id={e.id} name={e.fullName} subtitle={e.jobTitle[locale]} locale={locale} highlight />
                {p && <CardDescription className="mt-2 leading-relaxed">{p.summary[locale]}</CardDescription>}
              </CardHeader>
              <CardContent className="flex flex-col gap-5 text-sm">
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">{t.region}</dt>
                    <dd className="text-sm font-medium">{perf.region.name[locale]}</dd>
                    <dd className="text-muted-foreground">{perf.region.cities.map((c) => c[locale]).join(" · ")}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t.leadershipStyle}</dt>
                    <dd className="text-sm font-medium">{p?.leadershipStyle ? catalogLabel(LEADERSHIP_STYLES, p.leadershipStyle)[locale] : "—"}</dd>
                    <dd className="text-muted-foreground">{p ? COMMUNICATION_STYLE_SHORT[p.communicationStyle as keyof typeof COMMUNICATION_STYLE_SHORT]?.[locale] : ""}</dd>
                  </div>
                </dl>

                <div>
                  <h3 className="text-muted-foreground mb-2 text-xs font-medium">{t.indicators}</h3>
                  <dl className="grid grid-cols-2 gap-2 text-xs" data-testid="peer-indicators">
                    <div className="rounded-lg bg-muted/60 p-2.5">
                      <dt className="text-muted-foreground">{dict.indicators.achievement}</dt>
                      <dd className="flex items-center justify-between gap-1">
                        <span className="text-base font-semibold tabular-nums">{formatPercent(perf.achievement, locale)}</span>
                        <StatusBadge status={classify("achievement", perf.achievement)} dict={dict} />
                      </dd>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2.5">
                      <dt className="text-muted-foreground">{t.regionRank}</dt>
                      <dd className="text-base font-semibold tabular-nums">#{perf.rank} / 4</dd>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2.5">
                      <dt className="text-muted-foreground">{dict.indicators.salesActual}</dt>
                      <dd className="text-sm font-semibold tabular-nums">{formatCurrency(perf.salesActual, locale, true)}</dd>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2.5">
                      <dt className="text-muted-foreground">{dict.indicators.complianceScore}</dt>
                      <dd className="text-sm font-semibold tabular-nums">{formatPercent(perf.complianceScore, locale)}</dd>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2.5">
                      <dt className="text-muted-foreground">{dict.indicators.stockAvailability}</dt>
                      <dd className="text-sm font-semibold tabular-nums">{formatPercent(perf.stockAvailability, locale)}</dd>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2.5">
                      <dt className="text-muted-foreground">{dict.common.trend}</dt>
                      <dd><TrendIndicator direction={perf.achievementTrend.direction} label={dict.common.trendDir[perf.achievementTrend.direction]} /></dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    <SingleLineChart
                      height={140}
                      name={dict.indicators.achievement}
                      unit="%"
                      data={perf.achievementHistory.map((h) => ({ label: formatMonth(h.month, locale, true), value: Number(h.achievement.toFixed(1)), tooltipTitle: formatMonth(h.month, locale), valueLabel: formatPercent(h.achievement, locale) }))}
                    />
                  </div>
                </div>

                {p && (
                  <div>
                    <h3 className="text-muted-foreground mb-2 text-xs font-medium">{t.strengths}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {p.strengths.map((s) => <Badge key={s} variant="good">{catalogLabel(COMPETENCIES, s)[locale]}</Badge>)}
                    </div>
                  </div>
                )}

                {r && (
                  <div className="rounded-lg border p-3" data-testid="peer-relationship">
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="text-xs font-medium">{t.relationship}</h3>
                      <Badge variant={r.type === "rivalry" ? "critical" : r.type === "collaboration" ? "good" : "secondary"}>{dict.profile.relType[r.type]}</Badge>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{r.description[locale]}</p>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                      {([[dict.profile.trust, r.trust], [dict.profile.rapport, r.rapport]] as const).map(([k, v]) => (
                        <div key={k}>
                          <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="tabular-nums">{v}</span></div>
                          <Progress value={(v + 100) / 2} indicatorClassName={v >= 50 ? "bg-good" : v < 30 ? "bg-critical" : "bg-watch"} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
