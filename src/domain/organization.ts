import type { ISODate, LocalizedText } from "./common";

export interface Organization {
  id: string;
  code: string;
  name: LocalizedText;
  tagline: LocalizedText;
  headquarters: LocalizedText;
  foundedYear: number;
  /** Always true. PHARMA REALITY never models a real company. */
  isFictional: true;
}

export interface Region {
  id: string;
  code: string;
  name: LocalizedText;
  /** Main cities covered by the region. */
  cities: LocalizedText[];
  /** Employee id of the Area Supervisor responsible for this region. */
  supervisorId: string;
  /** True for the region managed by the player (current user). */
  isPlayerRegion: boolean;
  /** Number of branches in the region (peer regions are summarised, not modelled branch by branch). */
  branchCount: number;
}

export const ROLE_CODES = [
  "ceo",
  "operations_director",
  "area_supervisor",
  "department_head",
  "department_specialist",
  "branch_leader",
  "senior_pharmacist",
  "pharmacist",
  "junior_pharmacist",
] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export type Workforce = "executive" | "corporate" | "field" | "branch";

export interface Role {
  id: string;
  code: RoleCode;
  title: LocalizedText;
  /** 1 = CEO, larger numbers are further from the top. */
  level: number;
  workforce: Workforce;
}

export const BRANCH_ROLE_CODES: RoleCode[] = [
  "branch_leader",
  "senior_pharmacist",
  "pharmacist",
  "junior_pharmacist",
];

export interface DepartmentKpi {
  id: string;
  code: string;
  name: LocalizedText;
  unit: "percent" | "days" | "count" | "sar" | "hours" | "score";
  target: number;
  current: number;
  direction: "higher_is_better" | "lower_is_better";
}

export interface DepartmentContact {
  email: string;
  phoneExtension: string;
  location: LocalizedText;
}

export interface Department {
  id: string;
  code: string;
  name: LocalizedText;
  description: LocalizedText;
  headId: string;
  /** Employee id of the executive the department head reports to. */
  reportsToId: string | null;
  responsibilities: LocalizedText[];
  kpis: DepartmentKpi[];
  contact: DepartmentContact;
}

export type SimulationStatus = "not_started" | "active" | "paused" | "completed";

export interface SimulationSession {
  id: string;
  status: SimulationStatus;
  startDate: ISODate;
  lengthDays: number;
  currentDay: number;
}

export interface AppUser {
  id: string;
  /** Employee record that represents this user inside the simulation. */
  employeeId: string;
  displayName: string;
  appRole: "player" | "admin";
}
