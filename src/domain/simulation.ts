/**
 * Contracts for future simulation modules (Sprint 2+).
 *
 * Nothing in Sprint 1 creates or mutates these records. They exist so that the
 * database schema (supabase/migrations/0003_simulation_foundation.sql) and the
 * application share one vocabulary from the start.
 *
 * Architectural rule: AI engines may only PROPOSE content (dialogue, reactions,
 * memories). Authoritative business state (sales, inventory, staffing, metrics)
 * changes only through deterministic transitions recorded as `decisions` and
 * `scenario_events`, each of which is traceable to a simulation day.
 */
import type { DataProvenance, ISODate, LocalizedText } from "./common";

export interface SimulationDay {
  sessionId: string;
  dayNumber: number;
  virtualDate: ISODate;
  status: "upcoming" | "current" | "closed";
}

export type ScenarioSeverity = "low" | "medium" | "high" | "critical";

export interface ScenarioEvent {
  id: string;
  sessionId: string;
  dayNumber: number;
  eventType: string;
  severity: ScenarioSeverity;
  branchId: string | null;
  employeeIds: string[];
  title: LocalizedText;
  narrative: LocalizedText;
  /** Always "scenario_generated" — never mixed with seed data. */
  provenance: Extract<DataProvenance, "scenario_generated">;
  createdAt: string;
}

export interface Decision {
  id: string;
  sessionId: string;
  dayNumber: number;
  scenarioEventId: string | null;
  actorUserId: string;
  optionKey: string;
  rationale: string | null;
  /** Deterministic state changes applied by the consequence engine. */
  appliedEffects: Array<{ target: string; field: string; before: number; after: number }>;
  createdAt: string;
}

export interface CharacterMemory {
  id: string;
  sessionId: string;
  employeeId: string;
  dayNumber: number;
  memoryType: "interaction" | "observation" | "commitment" | "grievance" | "recognition";
  content: string;
  salience: number;
  sourceDecisionId: string | null;
}

export interface LeadershipAssessment {
  id: string;
  sessionId: string;
  periodStartDay: number;
  periodEndDay: number;
  dimensionScores: Record<string, number>;
  evidenceDecisionIds: string[];
}

export interface CoachingPlan {
  id: string;
  sessionId: string;
  weekNumber: number;
  focusAreas: string[];
  actions: LocalizedText[];
  status: "draft" | "active" | "completed";
}
