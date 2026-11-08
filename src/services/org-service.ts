/**
 * Organisation-level view models: org chart, departments, peer supervisors, regions.
 */
import type { Branch, RegionMetricRecord } from "@/domain/branch";
import type { Department, Region } from "@/domain/organization";
import type { Employee, EmployeeProfile, Relationship } from "@/domain/people";
import type { OrgRepository } from "@/data/repository/types";
import { achievementPct, aggregate, averageBasket, trend, type Trend } from "@/lib/analytics";
import { getBranchSummaries } from "./branch-service";

export interface PersonNode {
  id: string;
  name: Employee["fullName"];
  title: Employee["jobTitle"];
  employeeCode: string;
  isPlayer: boolean;
  isBranchLeader: boolean;
  performanceScore: number | null;
}

export interface OrgChart {
  ceo: PersonNode;
  operationsDirector: PersonNode;
  player: PersonNode;
  peers: Array<PersonNode & { region: Region["name"] }>;
  branches: Array<{ branch: Branch; leader: PersonNode | null; members: PersonNode[] }>;
  departments: Array<{ department: Department; head: PersonNode; members: PersonNode[] }>;
}

function toNode(e: Employee, profiles: Map<string, EmployeeProfile>): PersonNode {
  return {
    id: e.id,
    name: e.fullName,
    title: e.jobTitle,
    employeeCode: e.employeeCode,
    isPlayer: e.isPlayer,
    isBranchLeader: e.isBranchLeader,
    performanceScore: profiles.get(e.id)?.performanceScore ?? null,
  };
}

export async function getOrgChart(repo: OrgRepository): Promise<OrgChart> {
  const [employees, profiles, branches, departments, regions] = await Promise.all([
    repo.listEmployees(),
    repo.listProfiles(),
    repo.listBranches(),
    repo.listDepartments(),
    repo.listRegions(),
  ]);
  const p = new Map(profiles.map((x) => [x.employeeId, x]));
  const byId = new Map(employees.map((e) => [e.id, e]));
  const find = (pred: (e: Employee) => boolean) => {
    const e = employees.find(pred);
    if (!e) throw new Error("Organisation is missing a required executive or player record.");
    return e;
  };
  const ceo = find((e) => e.roleCode === "ceo");
  const od = find((e) => e.roleCode === "operations_director");
  const player = find((e) => e.isPlayer);
  return {
    ceo: toNode(ceo, p),
    operationsDirector: toNode(od, p),
    player: toNode(player, p),
    peers: employees
      .filter((e) => e.roleCode === "area_supervisor" && !e.isPlayer)
      .map((e) => ({ ...toNode(e, p), region: regions.find((r) => r.id === e.regionId)?.name ?? { en: "", ar: "" } }))
      .sort((a, b) => a.employeeCode.localeCompare(b.employeeCode)),
    branches: branches.map((branch) => {
      const staff = employees.filter((e) => e.branchId === branch.id).sort((a, b) => a.employeeCode.localeCompare(b.employeeCode));
      const leader = staff.find((s) => s.isBranchLeader);
      return { branch, leader: leader ? toNode(leader, p) : null, members: staff.filter((s) => !s.isBranchLeader).map((s) => toNode(s, p)) };
    }),
    departments: departments.map((department) => ({
      department,
      head: toNode(byId.get(department.headId)!, p),
      members: employees
        .filter((e) => e.departmentId === department.id && e.id !== department.headId && e.roleCode === "department_specialist")
        .sort((a, b) => a.employeeCode.localeCompare(b.employeeCode))
        .map((e) => toNode(e, p)),
    })),
  };
}

// ---------------------------------------------------------------- Departments

export interface DepartmentView {
  department: Department;
  head: Employee;
  headProfile: EmployeeProfile | null;
  reportsTo: Employee | null;
  members: Array<{ employee: Employee; profile: EmployeeProfile | null }>;
  kpisOnTrack: number;
}

export function kpiOnTrack(k: Department["kpis"][number]): boolean {
  return k.direction === "higher_is_better" ? k.current >= k.target : k.current <= k.target;
}

export async function getDepartments(repo: OrgRepository): Promise<DepartmentView[]> {
  const [departments, employees, profiles] = await Promise.all([repo.listDepartments(), repo.listEmployees(), repo.listProfiles()]);
  const byId = new Map(employees.map((e) => [e.id, e]));
  const p = new Map(profiles.map((x) => [x.employeeId, x]));
  return departments.map((department) => ({
    department,
    head: byId.get(department.headId)!,
    headProfile: p.get(department.headId) ?? null,
    reportsTo: department.reportsToId ? byId.get(department.reportsToId) ?? null : null,
    members: employees
      .filter((e) => e.departmentId === department.id && e.id !== department.headId && e.roleCode === "department_specialist")
      .sort((a, b) => a.employeeCode.localeCompare(b.employeeCode))
      .map((employee) => ({ employee, profile: p.get(employee.id) ?? null })),
    kpisOnTrack: department.kpis.filter(kpiOnTrack).length,
  }));
}

export async function getDepartmentDetail(repo: OrgRepository, code: string): Promise<DepartmentView | null> {
  const all = await getDepartments(repo);
  return all.find((d) => d.department.code.toLowerCase() === code.toLowerCase()) ?? null;
}

// ---------------------------------------------------------------- Regions & peers

export interface RegionPerformance {
  region: Region;
  supervisor: Employee | null;
  isPlayerRegion: boolean;
  /** "calculated" from branch records for the player region; "summary" from region snapshots for peers. */
  source: "calculated" | "summary";
  salesTarget: number;
  salesActual: number;
  achievement: number;
  averageBasket: number;
  stockAvailability: number;
  complianceScore: number;
  customerSatisfaction: number;
  achievementHistory: Array<{ month: string; achievement: number }>;
  achievementTrend: Trend;
  rank: number;
}

export async function getRegionalPerformance(repo: OrgRepository): Promise<RegionPerformance[]> {
  const [regions, regionMetrics, employees, summaries] = await Promise.all([
    repo.listRegions(),
    repo.listRegionMetrics(),
    repo.listEmployees(),
    getBranchSummaries(repo),
  ]);
  const months = [...new Set(summaries.flatMap((s) => s.history.map((h) => h.month)))].sort();
  const rows = regions.map((region): Omit<RegionPerformance, "rank"> => {
    const supervisor = employees.find((e) => e.id === region.supervisorId) ?? null;
    if (region.isPlayerRegion) {
      const current = aggregate(summaries.map((s) => s.current));
      const history = months.map((month) => {
        const a = aggregate(summaries.flatMap((s) => s.history.filter((h) => h.month === month)));
        return { month, achievement: a.achievement };
      });
      return {
        region, supervisor, isPlayerRegion: true, source: "calculated",
        salesTarget: current.salesTarget, salesActual: current.salesActual, achievement: current.achievement,
        averageBasket: current.averageBasket, stockAvailability: current.stockAvailability, complianceScore: current.complianceScore,
        customerSatisfaction: current.customerSatisfaction, achievementHistory: history,
        achievementTrend: trend(history.map((h) => h.achievement), 0.3),
      };
    }
    const list: RegionMetricRecord[] = regionMetrics.filter((m) => m.regionId === region.id).sort((a, b) => a.month.localeCompare(b.month));
    const cur = list.find((m) => m.provenance === "simulated_current") ?? list[list.length - 1];
    const history = list.map((m) => ({ month: m.month, achievement: achievementPct(m.salesActual, m.salesTarget) }));
    return {
      region, supervisor, isPlayerRegion: false, source: "summary",
      salesTarget: cur?.salesTarget ?? 0, salesActual: cur?.salesActual ?? 0,
      achievement: cur ? achievementPct(cur.salesActual, cur.salesTarget) : 0,
      averageBasket: cur ? averageBasket(cur.salesActual, cur.transactions) : 0,
      stockAvailability: cur?.stockAvailability ?? 0, complianceScore: cur?.complianceScore ?? 0,
      customerSatisfaction: cur?.customerSatisfaction ?? 0, achievementHistory: history,
      achievementTrend: trend(history.map((h) => h.achievement), 0.3),
    };
  });
  const sorted = [...rows].sort((a, b) => b.achievement - a.achievement);
  return rows.map((r) => ({ ...r, rank: sorted.indexOf(r) + 1 }));
}

export interface PeerSupervisorView {
  employee: Employee;
  profile: EmployeeProfile | null;
  performance: RegionPerformance;
  /** The player's relationship with this peer. */
  relationship: Relationship | null;
}

export async function getPeerSupervisors(repo: OrgRepository): Promise<PeerSupervisorView[]> {
  const [employees, profiles, regional, relationships] = await Promise.all([
    repo.listEmployees(),
    repo.listProfiles(),
    getRegionalPerformance(repo),
    repo.listRelationships(),
  ]);
  const player = employees.find((e) => e.isPlayer);
  return employees
    .filter((e) => e.roleCode === "area_supervisor" && !e.isPlayer)
    .sort((a, b) => a.employeeCode.localeCompare(b.employeeCode))
    .map((employee) => ({
      employee,
      profile: profiles.find((p) => p.employeeId === employee.id) ?? null,
      performance: regional.find((r) => r.region.id === employee.regionId)!,
      relationship: relationships.find((r) => r.sourceId === player?.id && r.targetId === employee.id) ?? null,
    }));
}
