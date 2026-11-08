/**
 * Main dashboard view model. Every number is calculated from repository records.
 */
import type { OrgRepository } from "@/data/repository/types";
import { aggregate, groupAggregate, summariseEmployeePerformance, type AggregateMetrics, type EmployeePerformanceSummary } from "@/lib/analytics";
import { getBranchSummaries, type BranchSummary } from "./branch-service";
import { getDepartments, getRegionalPerformance, type DepartmentView, type RegionPerformance } from "./org-service";

export interface DashboardData {
  organizationName: { en: string; ar: string };
  counts: {
    branches: number;
    pharmacists: number;
    branchLeaders: number;
    departments: number;
    peerSupervisors: number;
    headOfficeStaff: number;
    executives: number;
  };
  currentMonth: string;
  previousMonth: string | null;
  area: AggregateMetrics;
  areaPrevious: AggregateMetrics | null;
  branches: BranchSummary[];
  byGroup: Array<{ key: string; metrics: AggregateMetrics }>;
  byZone: Array<{ key: string; metrics: AggregateMetrics }>;
  attention: BranchSummary[];
  regions: RegionPerformance[];
  departments: DepartmentView[];
  employees: EmployeePerformanceSummary;
}

export async function getDashboard(repo: OrgRepository): Promise<DashboardData> {
  const [org, employees, profiles, branches, regions, departments] = await Promise.all([
    repo.getOrganization(),
    repo.listEmployees(),
    repo.listProfiles(),
    getBranchSummaries(repo),
    getRegionalPerformance(repo),
    getDepartments(repo),
  ]);
  const pharmacists = employees.filter((e) => e.branchId);
  const currentMonth = branches[0]?.current.month ?? "";
  const months = [...new Set(branches.flatMap((b) => b.history.map((h) => h.month)))].sort();
  const previousMonth = months[months.indexOf(currentMonth) - 1] ?? null;
  const scoreById = new Map(profiles.map((p) => [p.employeeId, p.performanceScore]));

  return {
    organizationName: org.name,
    counts: {
      branches: branches.length,
      pharmacists: pharmacists.length,
      branchLeaders: pharmacists.filter((e) => e.isBranchLeader).length,
      departments: departments.length,
      peerSupervisors: employees.filter((e) => e.roleCode === "area_supervisor" && !e.isPlayer).length,
      headOfficeStaff: employees.filter((e) => e.roleCode === "department_head" || e.roleCode === "department_specialist").length,
      executives: employees.filter((e) => e.roleCode === "ceo" || e.roleCode === "operations_director").length,
    },
    currentMonth,
    previousMonth,
    area: aggregate(branches.map((b) => b.current)),
    areaPrevious: previousMonth ? aggregate(branches.flatMap((b) => b.history.filter((h) => h.month === previousMonth))) : null,
    branches,
    byGroup: groupAggregate(branches, (b) => b.branch.performanceGroup, (b) => b.current).sort((a, b) => a.key.localeCompare(b.key)),
    byZone: groupAggregate(branches, (b) => b.branch.zone, (b) => b.current),
    attention: branches.filter((b) => b.needsAttention).sort((a, b) => b.attentionScore - a.attentionScore || a.performanceIndex - b.performanceIndex),
    regions,
    departments,
    employees: summariseEmployeePerformance(pharmacists.map((e) => ({ id: e.id, score: scoreById.get(e.id) ?? 0 }))),
  };
}
