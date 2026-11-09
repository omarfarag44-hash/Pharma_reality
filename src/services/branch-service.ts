/**
 * Branch view models. Combines repository records with the analytics engine.
 */
import type { Branch } from "@/domain/branch";
import type { Employee, EmployeeProfile } from "@/domain/people";
import type { OrgRepository } from "@/data/repository/types";
import {
  aggregate,
  attendanceRate,
  attentionFlags,
  attentionScore,
  deriveMetrics,
  experienceBand,
  indicatorStatuses,
  INDICATOR_KEYS,
  needsAttention,
  performanceBand,
  performanceIndex,
  rankByPerformance,
  strengthsAndOpportunities,
  trend,
  type AggregateMetrics,
  type AttentionFlag,
  type DerivedMetrics,
  type IndicatorKey,
  type IndicatorStatuses,
  type Trend,
} from "@/lib/analytics";

export interface BranchSummary {
  branch: Branch;
  code: string;
  leader: Employee | null;
  staff: Employee[];
  current: DerivedMetrics;
  history: DerivedMetrics[];
  performanceIndex: number;
  rank: number;
  statuses: IndicatorStatuses;
  flags: AttentionFlag[];
  attentionScore: number;
  needsAttention: boolean;
  salesTrend: Trend;
  customerTrend: Trend;
  achievementTrend: Trend;
}

export async function getBranchSummaries(repo: OrgRepository): Promise<BranchSummary[]> {
  const [branches, metrics, employees, attendance] = await Promise.all([
    repo.listBranches(),
    repo.listBranchMetrics(),
    repo.listEmployees(),
    repo.listAttendance(),
  ]);

  const staffByBranch = new Map<string, Employee[]>();
  employees.forEach((e) => {
    if (e.branchId) staffByBranch.set(e.branchId, [...(staffByBranch.get(e.branchId) ?? []), e]);
  });
  const branchOfEmployee = new Map(employees.filter((e) => e.branchId).map((e) => [e.id, e.branchId!]));
  const attendanceByBranchMonth = new Map<string, Array<{ scheduledShifts: number; attendedShifts: number }>>();
  attendance.forEach((a) => {
    const b = branchOfEmployee.get(a.employeeId);
    if (!b) return;
    const key = `${b}|${a.month}`;
    attendanceByBranchMonth.set(key, [...(attendanceByBranchMonth.get(key) ?? []), a]);
  });

  const summaries = branches.map((branch) => {
    const history = metrics
      .filter((m) => m.branchId === branch.id)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => deriveMetrics(m, attendanceRate(attendanceByBranchMonth.get(`${branch.id}|${m.month}`) ?? [])));
    const current = history.find((h) => h.provenance === "scenario_generated" || h.provenance === "simulated_current") ?? history[history.length - 1]!;
    const staff = (staffByBranch.get(branch.id) ?? []).sort((a, b) => Number(b.isBranchLeader) - Number(a.isBranchLeader) || a.employeeCode.localeCompare(b.employeeCode));
    const flags = attentionFlags(current);
    return {
      branch,
      code: branch.code,
      leader: staff.find((s) => s.isBranchLeader) ?? null,
      staff,
      current,
      history,
      performanceIndex: performanceIndex(current),
      rank: 0,
      statuses: indicatorStatuses(current),
      flags,
      attentionScore: attentionScore(flags),
      needsAttention: needsAttention(flags),
      salesTrend: trend(history.map((h) => h.salesActual)),
      customerTrend: trend(history.map((h) => h.transactions)),
      achievementTrend: trend(history.map((h) => h.achievement), 0.3),
    } satisfies BranchSummary;
  });
  const ranks = rankByPerformance(summaries);
  return summaries.map((s) => ({ ...s, rank: ranks.get(s.code)! }));
}

export function areaIndicatorAverages(area: AggregateMetrics): Record<IndicatorKey, number> {
  return Object.fromEntries(INDICATOR_KEYS.map((k) => [k, area[k]])) as Record<IndicatorKey, number>;
}

export interface BranchStaffMember {
  employee: Employee;
  profile: EmployeeProfile | null;
}

export interface BranchDetail {
  summary: BranchSummary;
  area: AggregateMetrics;
  areaCount: number;
  staff: BranchStaffMember[];
  strengths: IndicatorKey[];
  opportunities: AttentionFlag[];
  distribution: {
    byRole: Array<{ key: string; count: number }>;
    byPerformance: Array<{ key: string; count: number }>;
    byExperience: Array<{ key: string; count: number }>;
  };
  averageStaffPerformance: number;
}

function countBy<T>(items: T[], key: (t: T) => string, order: readonly string[]): Array<{ key: string; count: number }> {
  return order.map((k) => ({ key: k, count: items.filter((i) => key(i) === k).length }));
}

export async function getBranchDetail(repo: OrgRepository, code: string): Promise<BranchDetail | null> {
  const branch = await repo.getBranchByCode(code);
  if (!branch) return null;
  const [summaries, profiles] = await Promise.all([getBranchSummaries(repo), repo.listProfiles()]);
  const summary = summaries.find((s) => s.branch.id === branch.id)!;
  const area = aggregate(summaries.map((s) => s.current));
  const profileById = new Map(profiles.map((p) => [p.employeeId, p]));
  const staff = summary.staff.map((employee) => ({ employee, profile: profileById.get(employee.id) ?? null }));
  const { strengths, opportunities } = strengthsAndOpportunities(summary.current, areaIndicatorAverages(area));
  const scores = staff.map((s) => s.profile?.performanceScore ?? 0);
  return {
    summary,
    area,
    areaCount: summaries.length,
    staff,
    strengths,
    opportunities,
    distribution: {
      byRole: countBy(staff, (s) => s.employee.roleCode, ["branch_leader", "senior_pharmacist", "pharmacist", "junior_pharmacist"]),
      byPerformance: countBy(staff, (s) => performanceBand(s.profile?.performanceScore ?? 0), ["exceptional", "strong", "solid", "developing", "below"]),
      byExperience: countBy(staff, (s) => experienceBand(s.employee.yearsOfExperience), ["0-2", "3-5", "6-10", "11+"]),
    },
    averageStaffPerformance: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
  };
}
