import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, MapPin, Ruler, TrendingUp } from "lucide-react";
import { BRANCH_CATEGORY_LABELS, COMMUNICATION_STYLE_SHORT, PERFORMANCE_GROUP_LABELS, ZONE_LABELS } from "@/domain/catalogs";
import { INDICATOR_KEYS } from "@/lib/analytics";
import { formatCurrency, formatMonth, formatNumber, formatPercent, formatSignedCurrency, formatSignedPercent } from "@/lib/i18n/format";
import { pageContext } from "@/lib/page";
import { getBranchDetail } from "@/services/branch-service";
import { SalesTrendChart, SingleLineChart } from "@/components/charts/charts";
import { GROUP_COLORS } from "@/components/charts/palette";
import { formatIndicator, INDICATOR_SCALE } from "@/components/shared/indicator-format";
import { IndicatorRow } from "@/components/shared/indicator-row";
import { PageHeader } from "@/components/shared/page-header";
import { PersonLink } from "@/components/shared/person-link";
import { ProvenanceLegend } from "@/components/shared/provenance-legend";
import { StatTile } from "@/components/shared/stat-tile";
import { StatusBadge, TrendIndicator } from "@/components/shared/status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function BranchDetailPage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { code } = await params;
  const { locale, dict, repo } = await pageContext(params);
  const detail = await getBranchDetail(repo, decodeURIComponent(code));
  if (!detail) notFound();
  const { summary: s, area } = detail;
  const b = s.branch;
  const t = dict.branches;
  const color = GROUP_COLORS[b.performanceGroup]!;
  const days = 30;

  const salesData = s.history.map((h) => ({
    month: formatMonth(h.month, locale, true),
    target: h.salesTarget,
    actual: h.salesActual,
    isCurrent: h.provenance === "simulated_current",
    tooltipTitle: formatMonth(h.month, locale),
    targetLabel: formatCurrency(h.salesTarget, locale),
    actualLabel: formatCurrency(h.salesActual, locale),
    achievementLabel: formatPercent(h.achievement, locale),
    provenanceLabel: dict.common.provenance[h.provenance],
  }));

  return (
    <>
      <Link href={`/${locale}/branches`} className="text-muted-foreground mb-3 inline-flex items-center gap-1.5 text-xs hover:underline">
        <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
        {dict.nav.branches}
      </Link>
      <PageHeader
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="ltr-nums font-medium">{b.code}</span>
            <Badge variant="outline" className="gap-1.5">
              <span aria-hidden className="size-2 rounded-sm" style={{ background: color }} />
              {PERFORMANCE_GROUP_LABELS[b.performanceGroup][locale]}
            </Badge>
          </span>
        }
        title={b.name[locale]}
        description={b.context[locale]}
        actions={
          <div className="text-end">
            <div className="text-muted-foreground text-xs">{dict.indicators.performanceIndex}</div>
            <div className="text-2xl font-semibold tabular-nums" data-testid="branch-index">
              {formatNumber(s.performanceIndex, locale, 1)}
              <span className="text-muted-foreground ms-2 text-sm font-normal">
                #{s.rank} / {detail.areaCount}
              </span>
            </div>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={dict.indicators.salesActual}
          value={formatCurrency(s.current.salesActual, locale, true)}
          detail={`${dict.common.target}: ${formatCurrency(s.current.salesTarget, locale, true)}`}
        />
        <StatTile
          label={dict.indicators.achievement}
          value={formatPercent(s.current.achievement, locale)}
          detail={<span className="tabular-nums">{dict.indicators.variance}: {formatSignedCurrency(s.current.variance.amount, locale, true)} ({formatSignedPercent(s.current.variance.pct, locale)})</span>}
        />
        <StatTile
          label={dict.indicators.transactions}
          value={formatNumber(s.current.transactions, locale)}
          detail={<TrendIndicator direction={s.customerTrend.direction} label={`${dict.common.trendDir[s.customerTrend.direction]} · ${formatNumber(s.current.transactions / days, locale)} ${t.customersPerDay}`} />}
        />
        <StatTile label={dict.indicators.averageBasket} value={formatCurrency(s.current.averageBasket, locale)} detail={`${t.vsArea}: ${formatCurrency(area.averageBasket, locale)}`} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t.salesPerformance}</CardTitle>
            <CardDescription>{t.salesVsTarget}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: color }} />
                {dict.common.actual}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block h-0 w-4 border-t-2 border-dashed border-[#64748b]" />
                {dict.common.target}
              </span>
            </div>
            <SalesTrendChart data={salesData} color={color} labels={{ target: dict.common.target, actual: dict.common.actual, achievement: dict.indicators.achievement, provenance: dict.common.status }} />
            <ProvenanceLegend dict={dict} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.profile}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-muted-foreground flex items-center gap-1 text-xs"><MapPin className="size-3" aria-hidden />{dict.common.location}</dt>
                <dd>{b.district[locale]}, {b.city[locale]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{dict.common.region}</dt>
                <dd>{ZONE_LABELS[b.zone][locale]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t.category}</dt>
                <dd>{BRANCH_CATEGORY_LABELS[b.category][locale]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground flex items-center gap-1 text-xs"><Clock className="size-3" aria-hidden />{t.opened}</dt>
                <dd className="tabular-nums">{b.openedYear}{b.is24Hours ? ` · ${t.hours24}` : ""}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground flex items-center gap-1 text-xs"><Ruler className="size-3" aria-hidden />{t.area}</dt>
                <dd className="tabular-nums">{formatNumber(b.areaSqm, locale)} m²</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{dict.indicators.inventoryValue}</dt>
                <dd className="tabular-nums">{formatCurrency(s.current.inventoryValue, locale, true)}</dd>
              </div>
            </dl>
            {s.leader && (
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground mb-2 text-xs">{dict.common.leader}</div>
                <PersonLink id={s.leader.id} name={s.leader.fullName} subtitle={`${s.leader.yearsOfExperience} ${dict.common.yearsShort}`} locale={locale} highlight />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.operational}</CardTitle>
            <CardDescription>{t.vsArea}: ▏</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4" data-testid="operational-indicators">
            {INDICATOR_KEYS.map((k) => (
              <IndicatorRow
                key={k}
                label={dict.indicators[k]}
                value={s.current[k]}
                display={formatIndicator(k, s.current[k], locale)}
                status={s.statuses[k]}
                min={INDICATOR_SCALE[k].min}
                max={INDICATOR_SCALE[k].max}
                marker={area[k]}
                markerLabel={`${t.vsArea}: ${formatIndicator(k, area[k], locale)}`}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.historicalTrends}</CardTitle>
            <CardDescription>{t.customerTrend}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SingleLineChart
              name={dict.indicators.transactions}
              data={s.history.map((h) => ({ label: formatMonth(h.month, locale, true), value: h.transactions, tooltipTitle: formatMonth(h.month, locale), valueLabel: formatNumber(h.transactions, locale) }))}
            />
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-muted/60 p-2.5">
                <div className="text-muted-foreground">{dict.indicators.salesActual}</div>
                <TrendIndicator direction={s.salesTrend.direction} label={formatSignedPercent(s.salesTrend.changePct, locale)} />
              </div>
              <div className="rounded-lg bg-muted/60 p-2.5">
                <div className="text-muted-foreground">{dict.indicators.transactions}</div>
                <TrendIndicator direction={s.customerTrend.direction} label={formatSignedPercent(s.customerTrend.changePct, locale)} />
              </div>
              <div className="rounded-lg bg-muted/60 p-2.5">
                <div className="text-muted-foreground">{dict.indicators.achievement}</div>
                <TrendIndicator direction={s.achievementTrend.direction} label={formatSignedPercent(s.achievementTrend.last - s.achievementTrend.first, locale)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="text-good size-4" aria-hidden />{t.strengths}</CardTitle>
          </CardHeader>
          <CardContent data-testid="branch-strengths">
            {detail.strengths.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t.noStrengths}</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {detail.strengths.map((k) => (
                  <li key={k} className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                    <span>{dict.indicators[k]}</span>
                    <span className="tabular-nums">
                      <strong>{formatIndicator(k, s.current[k], locale)}</strong>
                      <span className="text-muted-foreground ms-2 text-xs">{t.vsArea} {formatIndicator(k, area[k], locale)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="text-watch size-4" aria-hidden />{t.opportunities}</CardTitle>
          </CardHeader>
          <CardContent data-testid="branch-opportunities">
            {detail.opportunities.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t.noOpportunities}</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {detail.opportunities.map((f) => (
                  <li key={f.indicator} className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                    <span>{dict.indicators[f.indicator]}</span>
                    <span className="flex items-center gap-2 tabular-nums">
                      <strong>{formatIndicator(f.indicator, f.value, locale)}</strong>
                      <StatusBadge status={f.status} dict={dict} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t.team} ({detail.staff.length})</CardTitle>
            <CardDescription>
              {t.avgStaffScore}: {formatNumber(detail.averageStaffPerformance, locale, 1)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2" data-testid="branch-staff">
              {detail.staff.map(({ employee: e, profile: p }) => (
                <li key={e.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <PersonLink id={e.id} name={e.fullName} subtitle={e.jobTitle[locale]} locale={locale} highlight={e.isBranchLeader} />
                    {e.isBranchLeader && <Badge variant="default">{dict.common.leader}</Badge>}
                  </div>
                  <dl className="text-muted-foreground mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt>{dict.profile.experience}</dt>
                      <dd className="text-foreground font-medium tabular-nums">{e.yearsOfExperience} {dict.common.yearsShort}</dd>
                    </div>
                    <div>
                      <dt>{dict.common.score}</dt>
                      <dd className="text-foreground font-medium tabular-nums">{p?.performanceScore ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>{dict.profile.communication}</dt>
                      <dd className="text-foreground font-medium">{p ? COMMUNICATION_STYLE_SHORT[p.communicationStyle as keyof typeof COMMUNICATION_STYLE_SHORT]?.[locale] : "—"}</dd>
                    </div>
                  </dl>
                  {e.employmentStatus !== "active" && <Badge variant="watch" className="mt-2">{dict.profile.statusLabel[e.employmentStatus]}</Badge>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.distribution}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 text-xs">
            {(
              [
                [t.byRole, detail.distribution.byRole, (k: string) => dict.roles[k as keyof typeof dict.roles]],
                [t.byPerformance, detail.distribution.byPerformance, (k: string) => dict.bands[k as keyof typeof dict.bands]],
                [t.byExperience, detail.distribution.byExperience, (k: string) => dict.experienceBands[k as keyof typeof dict.experienceBands]],
              ] as const
            ).map(([title, rows, label]) => (
              <div key={title}>
                <h3 className="text-muted-foreground mb-2 font-medium">{title}</h3>
                <ul className="flex flex-col gap-1.5">
                  {rows.map((r) => (
                    <li key={r.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                      <span>{label(r.key)}</span>
                      <span className="tabular-nums">{r.count}</span>
                      <Progress value={(r.count / Math.max(1, detail.staff.length)) * 100} className="col-span-2" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
