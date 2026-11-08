/**
 * The application's single data-access contract.
 * Screens and services depend on this interface only, never on a concrete source.
 */
import type { Branch, BranchMetricRecord, RegionMetricRecord } from "@/domain/branch";
import type { Department, Organization, Region, Role, SimulationSession } from "@/domain/organization";
import type {
  AttendanceRecord,
  Employee,
  EmployeeProfile,
  PerformanceReview,
  Relationship,
  ReportingLine,
  TrainingRecord,
} from "@/domain/people";
import type { DataMode } from "@/lib/env";

export interface OrgRepository {
  readonly mode: DataMode;
  getOrganization(): Promise<Organization>;
  getSimulationSession(): Promise<SimulationSession>;
  listRoles(): Promise<Role[]>;
  listRegions(): Promise<Region[]>;
  listDepartments(): Promise<Department[]>;
  getDepartmentByCode(code: string): Promise<Department | null>;
  listBranches(): Promise<Branch[]>;
  getBranchByCode(code: string): Promise<Branch | null>;
  /** All monthly records (history + current), optionally for one branch, ordered by month. */
  listBranchMetrics(branchId?: string): Promise<BranchMetricRecord[]>;
  listRegionMetrics(): Promise<RegionMetricRecord[]>;
  listEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | null>;
  listProfiles(): Promise<EmployeeProfile[]>;
  getProfile(employeeId: string): Promise<EmployeeProfile | null>;
  listReportingLines(): Promise<ReportingLine[]>;
  /** Relationships where the employee is source or target. */
  listRelationships(employeeId?: string): Promise<Relationship[]>;
  listPerformanceReviews(employeeId?: string): Promise<PerformanceReview[]>;
  listAttendance(employeeId?: string): Promise<AttendanceRecord[]>;
  listTrainings(employeeId?: string): Promise<TrainingRecord[]>;
}
