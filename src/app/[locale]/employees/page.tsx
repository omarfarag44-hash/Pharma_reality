import Link from "next/link";
import { COMMUNICATION_STYLE_SHORT } from "@/domain/catalogs";
import { filterEmployees } from "@/lib/directory/filters";
import { pageContext } from "@/lib/page";
import { listBranchEmployees } from "@/services/people-service";
import { EmployeeFiltersSchema } from "@/validation/filters";
import { FilterBar } from "@/components/directory/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar } from "@/components/shared/person-link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const bandVariant = { exceptional: "good", strong: "good", solid: "secondary", developing: "watch", below: "critical" } as const;

export default async function EmployeesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, dict, repo } = await pageContext(params);
  const filters = EmployeeFiltersSchema.parse(await searchParams);
  const [all, branches] = await Promise.all([listBranchEmployees(repo), repo.listBranches()]);
  const rows = filterEmployees(all, filters, locale);
  const t = dict.employees;

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
          { name: "branch", label: dict.common.branch, value: filters.branch, options: [{ value: "all", label: dict.common.all }, ...branches.map((b) => ({ value: b.code, label: `${b.code} · ${b.name[locale]}` }))] },
          { name: "role", label: t.role, value: filters.role, options: [{ value: "all", label: dict.common.all }, ...(["branch_leader", "senior_pharmacist", "pharmacist", "junior_pharmacist"] as const).map((r) => ({ value: r, label: dict.roles[r] }))] },
          { name: "experience", label: t.experience, value: filters.experience, options: [{ value: "all", label: dict.common.all }, ...(["0-2", "3-5", "6-10", "11+"] as const).map((x) => ({ value: x, label: dict.experienceBands[x] }))] },
          { name: "performance", label: t.performance, value: filters.performance, options: [{ value: "all", label: dict.common.all }, ...(["exceptional", "strong", "solid", "developing", "below"] as const).map((x) => ({ value: x, label: dict.bands[x] }))] },
          { name: "sort", label: dict.common.sortBy, value: filters.sort, options: (["code", "name", "performance", "experience"] as const).map((x) => ({ value: x, label: t[`sort_${x}`] })) },
        ]}
      />

      {rows.length === 0 ? (
        <Card className="text-muted-foreground items-center py-12 text-sm">{dict.common.noResults}</Card>
      ) : (
        <Card className="py-0">
          <Table data-testid="employee-table">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t.name}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.employeeId}</TableHead>
                <TableHead>{dict.common.branch}</TableHead>
                <TableHead className="hidden md:table-cell">{t.experience}</TableHead>
                <TableHead className="hidden lg:table-cell">{dict.profile.communication}</TableHead>
                <TableHead className="text-end">{t.performance}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ employee: e, profile: p, branch, performanceBand }) => (
                <TableRow key={e.id} data-testid="employee-row" data-leader={e.isBranchLeader ? "true" : "false"}>
                  <TableCell>
                    <Link href={`/${locale}/people/${e.id}`} className="group flex items-center gap-2.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Avatar name={e.fullName[locale]} highlight={e.isBranchLeader} />
                      <span className="min-w-0">
                        <span className="block font-medium group-hover:underline">{e.fullName[locale]}</span>
                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          {e.jobTitle[locale]}
                          {e.employmentStatus !== "active" && <Badge variant="watch" className="px-1.5 py-0 text-[10px]">{dict.profile.statusLabel[e.employmentStatus]}</Badge>}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground ltr-nums hidden text-xs sm:table-cell">{e.employeeCode}</TableCell>
                  <TableCell>
                    <Link href={`/${locale}/branches/${branch.code}`} className="hover:underline">
                      <span className="ltr-nums text-muted-foreground block text-xs">{branch.code}</span>
                      <span className="text-xs">{branch.name[locale]}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">{e.yearsOfExperience} {dict.common.yearsShort}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">{COMMUNICATION_STYLE_SHORT[p.communicationStyle as keyof typeof COMMUNICATION_STYLE_SHORT]?.[locale]}</TableCell>
                  <TableCell className="text-end">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("font-semibold tabular-nums")}>{p.performanceScore}</span>
                      <Badge variant={bandVariant[performanceBand]} className="hidden sm:inline-flex">{dict.bands[performanceBand].replace(/\s*\(.*\)/, "")}</Badge>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
