import Link from "next/link";
import { AlertTriangle, Building2, Target, TrendingUp, Users } from "lucide-react";
import { PERFORMANCE_GROUP_LABELS, ZONE_LABELS } from "@/domain/catalogs";
import { classify } from "@/lib/analytics";
import { fmt } from "@/lib/i18n";
import { formatCurrency, formatMonth, formatNumber, formatPercent, formatSignedPercent } from "@/lib/i18n/format";
import { pageContext } from "@/lib/page";
import { getDashboard } from "@/services/dashboard-service";
import { BranchAchievementChart, RegionComparisonChart } from "@/components/charts/charts";
import { GROUP_COLORS } from "@/components/charts/palette";
import { formatIndicator } from "@/components/shared/indicator-format";
import { PageHeader } from "@/components/shared/page-header";
import { PersonLink } from "@/components/shared/person-link";
import { ProvenanceLegend } from "@/components/shared/provenance-legend";
import { StatTile } from "@/components/shared/stat-tile";
import { StatusBadge, StatusDot, TrendIndicator } from "@/components/shared/status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, repo } = await pageContext(params);
  const d = await getDashboard(repo);
  const t = dict.dashboard;
  const achievementDelta = d.areaPrevious ? d.area.achievement - d.areaPrevious.achievement : null;
  const salesDelta = d.areaPrevious ? ((d.area.salesActual - d.areaPrevious.salesActual) / d.areaPrevious.salesActual) * 100 : null;

  const chartData = [...d.branches]
    .sort((a, b) => a.branch.number - b.branch.number)
    .map((b) => ({
      code: b.code,
      short: String(b.branch.number).padStart(2, "0"),
      achievement: Number(b.current.achievement.toFixed(1)),
      group: b.branch.performanceGroup,
      tooltipTitle: `${b.code} · ${b.branch.name[locale]}`,
      achievementLabel: formatPercent(b.current.achievement, locale),
      salesLabel: formatCurrency(b.current.salesActual, locale),
    }));

  return (
    <>
      <PageHeader title={t.title} description={`${t.subtitle} · ${formatMonth(d.currentMonth, locale)}`} />

      <section aria-label={t.title} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile testId="kpi-branches" label={t.totalBranches} value={formatNumber(d.counts.branches, locale)} icon={<Building2 />} detail={`A ${d.byGroup.find((g) => g.key === "A")?.metrics.count ?? 0} · B ${d.byGroup.find((g) => g.key === "B")?.metrics.count ?? 0} · C ${d.byGroup.find((g) => g.key === "C")?.metrics.count ?? 0}`} />
        <StatTile testId="kpi-employees" label={t.totalEmployees} value={formatNumber(d.counts.pharmacists, locale)} icon={<Users />} detail={fmt(t.leadersIncluded, { n: d.counts.branchLeaders })} />
        <StatTile
          testId="kpi-achievement"
          label={t.avgAchievement}
          value={<span className={classify("achievement", d.area.achievement) === "good" ? "" : "text-[oklch(0.5_0.12_65)]"}>{formatPercent(d.area.achievement, locale)}</span>}
          icon={<Target />}
          detail={achievementDelta !== null ? <TrendIndicator direction={achievementDelta > 0.05 ? "up" : achievementDelta < -0.05 ? "down" : "flat"} label={`${formatSignedPercent(achievementDelta, locale)} ${t.vsPrevious}`} /> : null}
        />
        <StatTile
          testId="kpi-sales"
          label={t.monthlySales}
          value={formatCurrency(d.area.salesActual, locale, true)}
          icon={<TrendingUp />}
          detail={salesDelta !== null ? <TrendIndicator direction={salesDelta > 0.1 ? "up" : salesDelta < -0.1 ? "down" : "flat"} label={`${formatSignedPercent(salesDelta, locale)} ${t.vsPrevious}`} /> : null}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t.branchPerformance}</CardTitle>
            <CardDescription>{t.branchPerformanceHint}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {(["A", "B", "C"] as const).map((g) => (
                <span key={g} className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: GROUP_COLORS[g] }} />
                  {PERFORMANCE_GROUP_LABELS[g][locale]}
                </span>
              ))}
            </div>
            <BranchAchievementChart data={chartData} labels={{ achievement: dict.indicators.achievement, sales: dict.indicators.salesActual }} />
            <ProvenanceLegend dict={dict} />
          </CardContent>
        </Card>

        <Card data-testid="attention-list">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-critical size-4" aria-hidden />
              {t.attention}
              <Badge variant="critical">{d.attention.length}</Badge>
            </CardTitle>
            <CardDescription>{t.attentionHint}</CardDescription>
          </CardHeader>
          <CardContent>
            {d.attention.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t.noAttention}</p>
            ) : (
              <ul className="divide-y">
                {d.attention.slice(0, 7).map((b) => (
                  <li key={b.code} className="py-2.5 first:pt-0">
                    <Link href={`/${locale}/branches/${b.code}`} className="group flex items-start justify-between gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2 text-sm font-medium">
                          <span className="ltr-nums text-muted-foreground text-xs">{b.code}</span>
                          <span className="group-hover:underline">{b.branch.name[locale]}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {b.flags.slice(0, 3).map((f) => (
                            <Badge key={f.indicator} variant={f.status} className="font-normal">
                              {dict.indicators[f.indicator]} {formatIndicator(f.indicator, f.value, locale)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{formatPercent(b.current.achievement, locale)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.regionalPerformance}</CardTitle>
            <CardDescription>{t.regionalHint}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <RegionComparisonChart
              data={d.regions.map((r) => ({
                name: r.isPlayerRegion ? `${r.region.name[locale]} ★` : r.region.name[locale],
                achievement: Number(r.achievement.toFixed(1)),
                isPlayer: r.isPlayerRegion,
                tooltipTitle: r.region.name[locale],
                achievementLabel: formatPercent(r.achievement, locale),
                sourceLabel: r.source === "calculated" ? dict.common.you : dict.peers.title,
              }))}
              labels={{ achievement: dict.indicators.achievement, source: dict.common.region }}
            />
            <div>
              <h3 className="mb-2 text-xs font-medium text-muted-foreground">{t.zonePerformance}</h3>
              <ul className="grid gap-2 sm:grid-cols-3">
                {d.byZone.map((z) => (
                  <li key={z.key} className="rounded-lg border p-3">
                    <div className="text-muted-foreground text-xs">{ZONE_LABELS[z.key as keyof typeof ZONE_LABELS][locale]}</div>
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <span className="text-lg font-semibold tabular-nums">{formatPercent(z.metrics.achievement, locale)}</span>
                      <span className="text-muted-foreground text-xs">{z.metrics.count} {dict.nav.branches}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.groupPerformance}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {d.byGroup.map((g) => (
                <div key={g.key} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: GROUP_COLORS[g.key] }} />
                      {PERFORMANCE_GROUP_LABELS[g.key as "A"][locale]}
                    </span>
                    <StatusBadge status={classify("achievement", g.metrics.achievement)} dict={dict} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                    {(
                      [
                        [dict.indicators.achievement, formatPercent(g.metrics.achievement, locale)],
                        [dict.indicators.stockAvailability, formatPercent(g.metrics.stockAvailability, locale)],
                        [dict.indicators.complianceScore, formatPercent(g.metrics.complianceScore, locale)],
                        [dict.indicators.averageBasket, formatCurrency(g.metrics.averageBasket, locale)],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="mt-0.5 text-sm font-semibold tabular-nums">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t.departments}</CardTitle>
            <Link href={`/${locale}/departments`} className="text-primary text-xs font-medium hover:underline">{dict.common.viewAll}</Link>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {d.departments.map((dep) => (
                <li key={dep.department.code}>
                  <Link href={`/${locale}/departments/${dep.department.code}`} className="hover:bg-muted/60 flex items-center justify-between gap-3 rounded-lg border p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{dep.department.name[locale]}</div>
                      <div className="text-muted-foreground truncate text-xs">{dep.head.fullName[locale]}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-xs tabular-nums">
                      <StatusDot status={dep.kpisOnTrack === dep.department.kpis.length ? "good" : dep.kpisOnTrack === 0 ? "critical" : "watch"} />
                      {fmt(t.kpisOnTrack, { n: dep.kpisOnTrack, total: dep.department.kpis.length })}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.organization}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-3 text-sm" data-testid="org-summary">
              {(
                [
                  [t.executives, d.counts.executives],
                  [t.peerSupervisors, d.counts.peerSupervisors],
                  [dict.nav.departments, d.counts.departments],
                  [t.headOffice, d.counts.headOfficeStaff],
                  [t.totalBranches, d.counts.branches],
                  [t.totalEmployees, d.counts.pharmacists],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="rounded-lg bg-muted/60 p-2.5">
                  <dt className="text-muted-foreground text-xs">{k}</dt>
                  <dd className="text-lg font-semibold tabular-nums">{formatNumber(v, locale)}</dd>
                </div>
              ))}
            </dl>
            <div>
              <div className="mb-2 flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground font-medium">{t.teamPerformance}</span>
                <span>
                  {t.averageScore}: <strong className="tabular-nums">{formatNumber(d.employees.average, locale, 1)}</strong>
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {(Object.entries(d.employees.distribution) as Array<[keyof typeof dict.bands, number]>).map(([band, n]) => (
                  <li key={band} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-muted-foreground">{dict.bands[band]}</span>
                    <span className="tabular-nums">{n}</span>
                    <Progress value={(n / Math.max(1, d.employees.count)) * 100} className="col-span-2" indicatorClassName={band === "below" || band === "developing" ? "bg-watch" : "bg-primary"} />
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-2 text-xs">
                {d.employees.needsSupportIds.length} {t.needsSupport}
              </p>
            </div>
            {d.employees.topPerformerIds.length > 0 && (
              <div className="flex flex-col gap-2">
                {d.branches
                  .flatMap((b) => b.staff)
                  .filter((e) => d.employees.topPerformerIds.slice(0, 3).includes(e.id))
                  .map((e) => (
                    <PersonLink key={e.id} id={e.id} name={e.fullName} subtitle={e.jobTitle[locale]} locale={locale} />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
