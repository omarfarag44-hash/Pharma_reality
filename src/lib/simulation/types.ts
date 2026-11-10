/**
 * Types shared by the Sprint 2 simulation engine (day loop, scenarios,
 * decisions, Leadership DNA, character memory and coaching plans).
 *
 * Scenarios are plain data. The engine that turns a decision into
 * consequences is pure and deterministic: the same progress always produces
 * the same world. Rule: AI may propose text in later sprints, but outcomes are
 * always computed by this tested code.
 */
import type { LocalizedText } from "@/domain/common";
import type { ScenarioSeverity } from "@/domain/simulation";

/** Branch fields a scenario can move. Units are documented per field in `engine.ts`. */
export const METRIC_FIELDS = ["sales", "stock", "compliance", "csat", "expiry", "slow"] as const;
export type MetricField = (typeof METRIC_FIELDS)[number];
export type MetricDelta = Record<MetricField, number>;

/**
 * People a scenario can involve.
 * - `leader` / `staff` / `colleague` are resolved inside the scenario's branch (`colleague` ≠ `staff`).
 * - The rest are resolved once from the organisation (peers, executives, department heads).
 */
export const ROLE_REFS = ["leader", "staff", "colleague", "khalid", "noura", "faisal", "ops", "ceo", "SCM", "PUR", "MKT", "QAC", "HR"] as const;
export type RoleRef = (typeof ROLE_REFS)[number];

export const DNA_DIMENSIONS = ["results", "people", "integrity", "customer", "collaboration", "decisiveness"] as const;
export type DnaDimension = (typeof DNA_DIMENSIONS)[number];

export const MEMORY_TYPES = ["interaction", "observation", "commitment", "grievance", "recognition"] as const;
export type MemoryType = (typeof MEMORY_TYPES)[number];

export type ScenarioCategory = "operations" | "inventory" | "people" | "customer" | "compliance" | "stakeholder";

/**
 * Work a person is asked to do in a scenario. Situational Leadership diagnoses a
 * development level per TASK, so the same pharmacist can be D4 on inventory and D2 on complaints.
 */
export const TASKS = ["sales", "clinical", "digital", "inventory", "conflict", "leadership", "customer", "compliance", "planning"] as const;
export type TaskCode = (typeof TASKS)[number];

/** Situational Leadership styles: S1 Directing, S2 Coaching, S3 Supporting, S4 Delegating. */
export const LEADERSHIP_STYLES = ["S1", "S2", "S3", "S4"] as const;
export type LeadershipStyle = (typeof LEADERSHIP_STYLES)[number];
export const DEVELOPMENT_LEVELS = ["D1", "D2", "D3", "D4"] as const;
export type DevelopmentLevel = (typeof DEVELOPMENT_LEVELS)[number];

/**
 * What the supervisor's action looks like to the person receiving it.
 * The Character Engine reads these against each person's motivators, stress triggers and personality.
 */
export const ACTION_TAGS = [
  "close_supervision",
  "public",
  "formal",
  "recognition",
  "listening",
  "development",
  "autonomy",
  "pressure",
  "support",
  "fairness",
] as const;
export type ActionTag = (typeof ACTION_TAGS)[number];

export type Effect =
  | { kind: "metric"; scope: "branch" | "area"; field: MetricField; delta: number }
  | { kind: "trust"; who: RoleRef; delta: number }
  /** Commitment (motivation + confidence) towards work, -100..100 shift from the person's baseline. */
  | { kind: "commitment"; who: RoleRef; delta: number }
  /** Relationship between two characters (neither is the player). */
  | { kind: "relation"; a: RoleRef; b: RoleRef; delta: number }
  | { kind: "memory"; who: RoleRef; type: MemoryType; text: LocalizedText; salience: number }
  | { kind: "flag"; flag: string };

export interface ScenarioOption {
  label: LocalizedText;
  /** What happened after the choice. Shown once the decision is made. */
  outcome: LocalizedText;
  dna: Partial<Record<DnaDimension, number>>;
  effects: Effect[];
  /** Metric effects are scaled by how much this person trusts the player (people-led options). */
  trustScaled?: RoleRef;
  /** The Situational Leadership style this option expresses (hidden from the player). */
  style?: LeadershipStyle;
  /** How the action is experienced by the scenario's subject (Character Engine input). */
  tags?: ActionTag[];
}

export type BranchSelector = "lowestStock" | "highestExpiry" | "lowestCsat" | "lowestCompliance" | "lowestAchievement" | "topAchievement" | "random" | "none";

export interface ScenarioTemplate {
  /** Stable numeric code used in saved progress. Never reuse or renumber. */
  code: number;
  key: string;
  category: ScenarioCategory;
  severity: ScenarioSeverity;
  title: LocalizedText;
  /** Supports {branch}, {leader}, {staff}, {colleague}, {khalid}, {noura}, {faisal}, {ops}, {ceo}, {SCM}, {PUR}, {MKT}, {QAC}, {HR}. */
  narrative: LocalizedText;
  branch: BranchSelector;
  /** How the scenario's `staff` member is picked. `junior` = least experienced. */
  staff?: "top" | "random" | "junior";
  /** Who appears on the scenario card (their trust and memories are shown). */
  people: RoleRef[];
  /** The person whose development level and reaction matter (Situational Leadership + Character Engine). */
  subject?: RoleRef;
  /** The task the subject is being led on (development level is diagnosed for this task). */
  task?: TaskCode;
  weight: number;
  /**
   * `leadership` = Sprint 3 situations, drawn from their own daily stream (at most one a day,
   * separate seed) so the core schedule of situations is unchanged.
   */
  stream?: "leadership";
  minDay?: number;
  /** Always happens on this day. */
  fixedDay?: number;
  /** Always happens on this weekday (0 = Sunday). */
  fixedWeekday?: number;
  once?: boolean;
  /** Minimum days between two occurrences. */
  cooldown?: number;
  /** Only eligible once this flag was set at least `afterDays` days ago. */
  requires?: { flag: string; afterDays: number };
  /** Option order is part of saved progress: append, never reorder. */
  options: ScenarioOption[];
  ignored: { outcome: LocalizedText; dna?: Partial<Record<DnaDimension, number>>; effects: Effect[] };
}

export const COACHING_FOCUS = ["stock", "compliance", "csat", "sales", "expiry"] as const;
export type CoachingFocus = (typeof COACHING_FOCUS)[number];
