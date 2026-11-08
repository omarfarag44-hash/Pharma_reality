/**
 * Employee directory and person profile view models.
 */
import type { Branch } from "@/domain/branch";
import type { Department, Region, Role } from "@/domain/organization";
import type {
  AttendanceRecord,
  Employee,
  EmployeeProfile,
  PerformanceReview,
  Relationship,
  ReportingLine,
  TrainingRecord,
} from "@/domain/people";
import type { OrgRepository } from "@/data/repository/types";
import { attendanceRate, experienceBand, performanceBand, type ExperienceBand, type PerformanceBand } from "@/lib/analytics";

export interface EmployeeListItem {
  employee: Employee;
  profile: EmployeeProfile;
  branch: Branch;
  performanceBand: PerformanceBand;
  experienceBand: ExperienceBand;
}

/** The 60 branch pharmacists, ordered by branch then position. */
export async function listBranchEmployees(repo: OrgRepository): Promise<EmployeeListItem[]> {
  const [employees, profiles, branches] = await Promise.all([repo.listEmployees(), repo.listProfiles(), repo.listBranches()]);
  const profileById = new Map(profiles.map((p) => [p.employeeId, p]));
  const branchById = new Map(branches.map((b) => [b.id, b]));
  return employees
    .filter((e) => e.branchId && branchById.has(e.branchId))
    .map((employee) => {
      const profile = profileById.get(employee.id)!;
      return {
        employee,
        profile,
        branch: branchById.get(employee.branchId!)!,
        performanceBand: performanceBand(profile.performanceScore),
        experienceBand: experienceBand(employee.yearsOfExperience),
      };
    })
    .sort((a, b) => a.employee.employeeCode.localeCompare(b.employee.employeeCode));
}

export interface PersonLink {
  employee: Employee;
  lineType?: ReportingLine["lineType"];
  context?: ReportingLine["context"];
}

export interface RelationshipView {
  relationship: Relationship;
  /** The other person in the relationship. */
  counterpart: Employee;
  /** "outgoing" when this person is the source (their view of the counterpart). */
  direction: "outgoing" | "incoming";
}

export interface PersonDetail {
  employee: Employee;
  profile: EmployeeProfile | null;
  role: Role | null;
  branch: Branch | null;
  department: Department | null;
  region: Region | null;
  managers: PersonLink[];
  directReports: PersonLink[];
  relationships: RelationshipView[];
  reviews: PerformanceReview[];
  attendance: AttendanceRecord[];
  attendanceSummary: { rate: number; lateArrivals: number; unplannedAbsences: number; months: number } | null;
  trainings: TrainingRecord[];
  teammates: Employee[];
}

export async function getPersonDetail(repo: OrgRepository, id: string): Promise<PersonDetail | null> {
  const employee = await repo.getEmployee(id);
  if (!employee) return null;
  const [profile, roles, branches, departments, regions, lines, relationships, reviews, attendance, trainings, employees] = await Promise.all([
    repo.getProfile(id),
    repo.listRoles(),
    repo.listBranches(),
    repo.listDepartments(),
    repo.listRegions(),
    repo.listReportingLines(),
    repo.listRelationships(id),
    repo.listPerformanceReviews(id),
    repo.listAttendance(id),
    repo.listTrainings(id),
    repo.listEmployees(),
  ]);
  const byId = new Map(employees.map((e) => [e.id, e]));
  const managers = lines
    .filter((l) => l.employeeId === id)
    .sort((a, b) => (a.lineType === "solid" ? -1 : 1) - (b.lineType === "solid" ? -1 : 1))
    .flatMap((l) => (byId.has(l.managerId) ? [{ employee: byId.get(l.managerId)!, lineType: l.lineType, context: l.context }] : []));
  const directReports = lines
    .filter((l) => l.managerId === id)
    .flatMap((l) => (byId.has(l.employeeId) ? [{ employee: byId.get(l.employeeId)!, lineType: l.lineType, context: l.context }] : []))
    .sort((a, b) => a.employee.employeeCode.localeCompare(b.employee.employeeCode));
  const rels: RelationshipView[] = relationships
    .flatMap((r) => {
      const outgoing = r.sourceId === id;
      const other = byId.get(outgoing ? r.targetId : r.sourceId);
      return other ? [{ relationship: r, counterpart: other, direction: outgoing ? ("outgoing" as const) : ("incoming" as const) }] : [];
    })
    .sort((a, b) => b.relationship.trust - a.relationship.trust);
  const region = regions.find((r) => r.id === employee.regionId) ?? null;
  return {
    employee,
    profile,
    role: roles.find((r) => r.code === employee.roleCode) ?? null,
    branch: branches.find((b) => b.id === employee.branchId) ?? null,
    department: departments.find((d) => d.id === employee.departmentId) ?? null,
    region,
    managers,
    directReports,
    relationships: rels,
    reviews,
    attendance,
    attendanceSummary: attendance.length
      ? {
          rate: attendanceRate(attendance),
          lateArrivals: attendance.reduce((s, a) => s + a.lateArrivals, 0),
          unplannedAbsences: attendance.reduce((s, a) => s + a.unplannedAbsences, 0),
          months: attendance.length,
        }
      : null,
    trainings,
    teammates: employee.branchId ? employees.filter((e) => e.branchId === employee.branchId && e.id !== id) : [],
  };
}
