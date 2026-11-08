import Link from "next/link";
import { BRANCH_CATEGORY_LABELS, PERFORMANCE_GROUP_LABELS } from "@/domain/catalogs";
import { BRANCH_SORT_KEYS } from "@/lib/analytics";
import { filterBranches } from "@/lib/directory/filters";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/i18n/format";
import { pageContext } from "@/lib/page";
import { getBranchSummaries } from "@/services/branch-service";
import { BranchFiltersSchema } from "@/validation/filters";
import { GROUP_COLORS } from "@/components/charts/palette";
import { FilterBar } from "@/components/directory/filter-bar";
import { formatIndicator } from "@/components/shared/indicator-format";
import { PageHeader } from "@/components/shared/page-header";
import { StatusDot, statusText } from "@/components/shared/status";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default async function BranchesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, dict, repo } = await pageContext(params);
  const filters = BranchFiltersSchema.parse(await searchParams);
  const all = await getBranchSummaries(repo);
  const rows = filterBranches(all, filters);
  const t = dict.branches;

  return (
    <>
      <PageHeader title={t.title} description={t.subtitle} />
      <FilterBar
        searchLabel={dict.common.search}
        searchPlaceholder={t.searchPlaceholder}
        searchValue={filters.q ?? ""}
        resetLabel={dict.common.reset}
        resultLabel={`${rows.length} / ${all.length} ${dict.common.results}`}
        selects={[
          { name: "group", label: t.group, value: filters.group, options: [{ value: "all", label: dict.common.all }, ...(["A", "B", "C"] as const).map((g) => ({ value: g, label: PERFORMANCE_GROUP_LABELS[g][locale] }))] },
          {
            name: "status",
            label: t.performance,
            value: filters.status,
            options: [
              { value: "all", label: dict.common.all },
              { value: "on_target", label: t.status_on_target },
              { value: "below_target", label: t.status_below_target },
              { value: "attention", label: t.status_attention },
            ],
          },
          { name: "sort", label: dict.common.sortBy, value: filters.sort, options: BRANCH_SORT_KEYS.map((k) => ({ value: k, label: t[`sort_${k}`] })) },
          { name: "dir", label: dict.common.direction, value: filters.dir, options: [{ value: "desc", label: dict.common.descending }, { value: "asc", label: dict.common.ascending }] },
        ]}
      />

      {rows.length === 0 ? (
        <Card className="text-muted-foreground items-center py-12 text-sm">{dict.common.noResults}</Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="grid gap-3 md:hidden" data-testid="branch-cards">
            {rows.map((b) => (
              <li key={b.code}>
                <Link href={`/${locale}/branches/${b.code}`} className="bg-card block rounded-xl border p-4 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-muted-foreground ltr-nums text-xs">{b.code}</div>
                      <div className="truncate font-medium">{b.branch.name[locale]}</div>
                      <div className="text-muted-foreground truncate text-xs">{b.branch.district[locale]} · {b.branch.city[locale]}</div>
                    </div>
                    <span className={cn("text-lg font-semibold tabular-nums", statusText(b.statuses.achievement))}>{formatPercent(b.current.achievement, locale)}</span>
                  </div>
                  <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span>#{b.rank}</span>
                    <span>{formatCurrency(b.current.salesActual, locale, true)}</span>
                    <span>{dict.indicators.stockAvailability} {formatPercent(b.current.stockAvailability, locale)}</span>
                    <span>{dict.indicators.complianceScore} {formatPercent(b.current.complianceScore, locale)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <Card className="hidden py-0 md:flex">
            <Table data-testid="branch-table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">{dict.common.rank}</TableHead>
                  <TableHead>{dict.common.branch}</TableHead>
                  <TableHead>{t.group}</TableHead>
                  <TableHead className="text-end">{dict.indicators.salesActual}</TableHead>
                  <TableHead className="text-end">{dict.indicators.achievement}</TableHead>
                  <TableHead className="text-end">{dict.indicators.averageBasket}</TableHead>
                  <TableHead className="text-end">{dict.indicators.stockAvailability}</TableHead>
                  <TableHead className="text-end">{dict.indicators.complianceScore}</TableHead>
                  <TableHead className="text-end">{dict.indicators.nearExpiryPct}</TableHead>
                  <TableHead className="text-end">{dict.indicators.performanceIndex}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((b) => (
                  <TableRow key={b.code} data-testid="branch-row" data-code={b.code}>
                    <TableCell className="text-muted-foreground tabular-nums">{b.rank}</TableCell>
                    <TableCell>
                      <Link href={`/${locale}/branches/${b.code}`} className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                        <span className="font-medium group-hover:underline">{b.branch.name[locale]}</span>
                        <span className="text-muted-foreground block text-xs">
                          <span className="ltr-nums">{b.code}</span> · {b.branch.district[locale]} · {BRANCH_CATEGORY_LABELS[b.branch.category][locale]}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5">
                        <span aria-hidden className="size-2 rounded-sm" style={{ background: GROUP_COLORS[b.branch.performanceGroup] }} />
                        {b.branch.performanceGroup}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end tabular-nums">{formatCurrency(b.current.salesActual, locale, true)}</TableCell>
                    <TableCell className={cn("text-end font-semibold tabular-nums", statusText(b.statuses.achievement))}>{formatPercent(b.current.achievement, locale)}</TableCell>
                    <TableCell className="text-end tabular-nums">{formatNumber(b.current.averageBasket, locale)}</TableCell>
                    {(["stockAvailability", "complianceScore", "nearExpiryPct"] as const).map((k) => (
                      <TableCell key={k} className="text-end tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <StatusDot status={b.statuses[k]} label={dict.common[`status_${b.statuses[k]}`]} />
                          {formatIndicator(k, b.current[k], locale)}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell className="text-end font-medium tabular-nums">{formatNumber(b.performanceIndex, locale, 1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </>
  );
}
