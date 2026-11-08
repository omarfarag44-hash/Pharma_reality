import type { Branch, BranchMetricRecord, RegionMetricRecord } from "./branch";
import type {
  AppUser,
  Department,
  Organization,
  Region,
  Role,
  SimulationSession,
} from "./organization";
import type {
  AttendanceRecord,
  Employee,
  EmployeeProfile,
  PerformanceReview,
  Relationship,
  ReportingLine,
  TrainingRecord,
} from "./people";

/**
 * The complete organisational world for one organisation.
 * Both data sources (demo seed and Supabase/Postgres) produce exactly this shape,
 * so every screen, service and calculation works identically in either mode.
 */
export interface OrgDataset {
  organization: Organization;
  roles: Role[];
  regions: Region[];
  departments: Department[];
  branches: Branch[];
  employees: Employee[];
  profiles: EmployeeProfile[];
  reportingLines: ReportingLine[];
  relationships: Relationship[];
  branchMetrics: BranchMetricRecord[];
  regionMetrics: RegionMetricRecord[];
  performanceReviews: PerformanceReview[];
  attendance: AttendanceRecord[];
  trainings: TrainingRecord[];
  users: AppUser[];
  simulation: SimulationSession;
}
