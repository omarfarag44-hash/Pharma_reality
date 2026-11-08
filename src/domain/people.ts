import type { DataProvenance, Gender, ISODate, LocalizedText, MonthKey } from "./common";
import type { RoleCode } from "./organization";

export type EmploymentStatus = "active" | "probation" | "on_leave";

export interface Employee {
  id: string;
  /** Human-readable id such as NX-10024. */
  employeeCode: string;
  fullName: LocalizedText;
  gender: Gender;
  roleCode: RoleCode;
  jobTitle: LocalizedText;
  branchId: string | null;
  departmentId: string | null;
  regionId: string | null;
  isBranchLeader: boolean;
  /** True only for the Area Supervisor played by the current user. */
  isPlayer: boolean;
  yearsOfExperience: number;
  hireDate: ISODate;
  employmentStatus: EmploymentStatus;
  email: string;
  phoneExtension: string;
}

export interface PersonalityProfile {
  /** Big Five traits on a 0–100 scale. */
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  emotionalStability: number;
}

export type LeadershipPotentialBand = "emerging" | "developing" | "ready" | "high";

export interface SkillRating {
  code: string;
  /** 1 (foundation) – 5 (expert). */
  level: number;
}

/**
 * Behavioural attributes reserved for the future Character Personality and
 * Human Behavior engines. They are descriptive inputs only; no engine reads them yet.
 */
export interface BehavioralTraits {
  motivators: string[];
  stressTriggers: string[];
  /** How the person tends to handle disagreement. */
  conflictApproach: "confronting" | "collaborating" | "compromising" | "avoiding" | "accommodating";
  /** How the person tends to decide. */
  decisionStyle: "intuitive" | "data_driven" | "consensus" | "rule_based";
}

export interface EmployeeProfile {
  employeeId: string;
  summary: LocalizedText;
  strengths: string[];
  developmentAreas: string[];
  communicationStyle: string;
  leadershipStyle: string | null;
  leadershipPotentialScore: number;
  leadershipPotential: LeadershipPotentialBand;
  performanceScore: number;
  careerAspiration: string;
  personality: PersonalityProfile;
  behavior: BehavioralTraits;
  skills: SkillRating[];
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  /** e.g. "2026-Q4" */
  period: string;
  periodEnd: ISODate;
  score: number;
  provenance: DataProvenance;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  month: MonthKey;
  scheduledShifts: number;
  attendedShifts: number;
  lateArrivals: number;
  unplannedAbsences: number;
  provenance: DataProvenance;
}

export interface TrainingRecord {
  id: string;
  employeeId: string;
  courseCode: string;
  status: "completed" | "in_progress" | "planned";
  completedOn: ISODate | null;
  hours: number;
}

export type ReportingLineType = "solid" | "dotted";

export interface ReportingLine {
  id: string;
  employeeId: string;
  managerId: string;
  lineType: ReportingLineType;
  context: LocalizedText | null;
}

export const RELATIONSHIP_TYPES = [
  "manager",
  "peer",
  "collaboration",
  "mentorship",
  "friendship",
  "rivalry",
  "friction",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

/**
 * A directed working relationship as seen from `sourceId`.
 * Trust and rapport are on a -100..100 scale. Future social-intelligence
 * engines will evolve these values through deterministic, audited transitions.
 */
export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  trust: number;
  rapport: number;
  description: LocalizedText;
}
