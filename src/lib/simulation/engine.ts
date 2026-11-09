/**
 * Deterministic simulation engine (Sprint 2).
 *
 * The whole simulation is a pure function of the organisation dataset and the
 * player's saved progress (which day it is, what they chose, which coaching
 * plans they started). `runSimulation` replays the progress day by day:
 *
 *   for each day: generate scenarios → apply recorded decisions →
 *                 apply coaching starts → (if the day is closed) apply ignored
 *                 scenarios and daily coaching progress
 *
 * No randomness escapes the seeded RNG, so the same progress always gives the same world.
 */
import type { OrgDataset } from "@/domain/dataset";
import type { MonthlyMetrics } from "@/domain/branch";
import type { LocalizedText } from "@/domain/common";
import { createRng } from "@/data/seed/random";
import { percentOf } from "@/lib/analytics/metrics";
import { addDaysIso } from "./calendar";
import { SCENARIOS, SCENARIO_BY_CODE } from "./scenarios";
import type { Progress } from "./progress";
import {
  COACHING_FOCUS,
  DNA_DIMENSIONS,
  METRIC_FIELDS,
  type CoachingFocus,
  type DnaDimension,
  type Effect,
  type MemoryType,
  type MetricDelta,
  type MetricField,
  type RoleRef,
  type ScenarioOption,
  type ScenarioTemplate,
} from "./types";

// ----------------------------------------------------------------------------- world

export interface WorldBranch {
  id: string;
  code: string;
  number: number;
  leaderId: string;
  /** Non-leader staff, best performer first. */
  staffIds: string[];
  base: MonthlyMetrics;
}

export interface World {
  playerId: string;
  startDate: string;
  lengthDays: number;
  branches: WorldBranch[];
  /** Organisation-wide characters (peers, executives, department heads). */
  people: Partial<Record<RoleRef, string>>;
  /** Opening trust between each person and the player (-100..100). */
  baseTrust: Map<string, number>;
}

const DEPT_ROLES = ["SCM", "PUR", "MKT", "QAC", "HR"] as const;
const PEER_ROLES = { WST: "khalid", EST: "noura", STH: "faisal" } as const;

export function buildWorld(d: OrgDataset): World {
  const player = d.employees.find((e) => e.isPlayer);
  if (!player) throw new Error("Simulation needs a player");
  const score = new Map(d.profiles.map((p) => [p.employeeId, p.performanceScore]));
  const branches: WorldBranch[] = [...d.branches]
    .sort((a, b) => a.number - b.number)
    .map((b) => {
      const staff = d.employees.filter((e) => e.branchId === b.id);
      const leader = staff.find((e) => e.isBranchLeader) ?? staff[0]!;
      const base = d.branchMetrics.find((m) => m.branchId === b.id && m.provenance === "simulated_current") ?? d.branchMetrics.filter((m) => m.branchId === b.id).at(-1)!;
      return {
        id: b.id,
        code: b.code,
        number: b.number,
        leaderId: leader.id,
        staffIds: staff
          .filter((e) => e.id !== leader.id)
          .sort((x, y) => (score.get(y.id) ?? 0) - (score.get(x.id) ?? 0) || x.employeeCode.localeCompare(y.employeeCode))
          .map((e) => e.id),
        base,
      };
    });

  const people: Partial<Record<RoleRef, string>> = {};
  people.ceo = d.employees.find((e) => e.roleCode === "ceo")?.id;
  people.ops = d.employees.find((e) => e.roleCode === "operations_director")?.id;
  for (const r of d.regions) {
    const role = PEER_ROLES[r.code as keyof typeof PEER_ROLES];
    if (role && r.supervisorId !== player.id) people[role] = r.supervisorId;
  }
  for (const code of DEPT_ROLES) people[code] = d.departments.find((x) => x.code === code)?.headId;

  const baseTrust = new Map<string, number>();
  for (const r of d.relationships) {
    if (r.sourceId === player.id && !baseTrust.has(r.targetId)) baseTrust.set(r.targetId, r.trust);
  }
  for (const r of d.relationships) {
    if (r.targetId === player.id && !baseTrust.has(r.sourceId)) baseTrust.set(r.sourceId, r.trust);
  }

  return { playerId: player.id, startDate: d.simulation.startDate, lengthDays: d.simulation.lengthDays, branches, people, baseTrust };
}

// ----------------------------------------------------------------------------- state

export interface ScenarioInstance {
  /** `d{day}-{code}`, unique within a run. */
  id: string;
  code: number;
  day: number;
  branchId: string | null;
  people: Partial<Record<RoleRef, string>>;
}

export interface AppliedEffect {
  kind: "metric" | "trust";
  /** Branch id (metric) or employee id (trust). */
  target: string;
  field: MetricField | "trust";
  before: number;
  after: number;
}

export interface DecisionRecord {
  instance: ScenarioInstance;
  /** Index into the template's options, or null when the scenario was ignored. */
  option: number | null;
  day: number;
  dna: Partial<Record<DnaDimension, number>>;
  effects: AppliedEffect[];
}

export interface Memory {
  employeeId: string;
  day: number;
  type: MemoryType;
  text: LocalizedText;
  salience: number;
  /** Scenario that created it (resolves {placeholders} at display time). */
  instance: ScenarioInstance | null;
}

export interface CoachingPlanState {
  branchId: string;
  leaderId: string;
  focus: CoachingFocus;
  startDay: number;
  endDay: number;
  status: "active" | "completed";
}

export interface SimState {
  day: number;
  completed: boolean;
  deltas: Map<string, MetricDelta>;
  trust: Map<string, number>;
  flags: Map<string, number>;
  dna: Record<DnaDimension, number>;
  decisions: DecisionRecord[];
  memories: Memory[];
  coaching: CoachingPlanState[];
  /** All scenarios generated so far, by day. */
  events: Map<number, ScenarioInstance[]>;
  /** Last day each template fired. */
  lastFired: Map<number, number>;
}

export const COACHING_DAYS = 7;
export const MAX_ACTIVE_COACHING = 3;
/** Daily improvement while a coaching plan is active, in the field's own unit. */
export const COACHING_DAILY: Record<CoachingFocus, { field: MetricField; delta: number }> = {
  stock: { field: "stock", delta: 0.35 },
  compliance: { field: "compliance", delta: 0.45 },
  csat: { field: "csat", delta: 0.35 },
  sales: { field: "sales", delta: 0.25 },
  expiry: { field: "expiry", delta: -2.5 },
};

const zeroDelta = (): MetricDelta => Object.fromEntries(METRIC_FIELDS.map((f) => [f, 0])) as MetricDelta;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, digits = 2) => Math.round(v * 10 ** digits) / 10 ** digits;

function initialState(): SimState {
  return {
    day: 1,
    completed: false,
    deltas: new Map(),
    trust: new Map(),
    flags: new Map(),
    dna: Object.fromEntries(DNA_DIMENSIONS.map((d) => [d, 0])) as Record<DnaDimension, number>,
    decisions: [],
    memories: [],
    coaching: [],
    events: new Map(),
    lastFired: new Map(),
  };
}

// ----------------------------------------------------------------------------- metrics

/** Applies cumulative scenario deltas to a branch's opening metrics. Pure. */
export function adjustMetrics(base: MonthlyMetrics, d: MetricDelta | undefined): MonthlyMetrics {
  if (!d) return base;
  const salesFactor = Math.max(0, 1 + d.sales / 100);
  return {
    ...base,
    salesActual: Math.round(base.salesActual * salesFactor),
    transactions: Math.round(base.transactions * salesFactor),
    stockAvailability: round(clamp(base.stockAvailability + d.stock, 0, 100), 1),
    complianceScore: round(clamp(base.complianceScore + d.compliance, 0, 100), 1),
    customerSatisfaction: round(clamp(base.customerSatisfaction + d.csat, 0, 100), 1),
    nearExpiryValue: Math.round(base.nearExpiryValue * Math.max(0, 1 + d.expiry / 100)),
    slowMovingValue: Math.round(base.slowMovingValue * Math.max(0, 1 + d.slow / 100)),
  };
}

/** The displayed value of a field (achievement % for sales, % of inventory for expiry and slow-moving). */
export function fieldValue(m: MonthlyMetrics, field: MetricField): number {
  switch (field) {
    case "sales":
      return round(percentOf(m.salesActual, m.salesTarget), 1);
    case "stock":
      return m.stockAvailability;
    case "compliance":
      return m.complianceScore;
    case "csat":
      return m.customerSatisfaction;
    case "expiry":
      return round(percentOf(m.nearExpiryValue, m.inventoryValue), 2);
    case "slow":
      return round(percentOf(m.slowMovingValue, m.inventoryValue), 2);
  }
}

export function currentMetrics(world: World, state: SimState, branchId: string): MonthlyMetrics {
  const b = world.branches.find((x) => x.id === branchId)!;
  return adjustMetrics(b.base, state.deltas.get(branchId));
}

export function trustOf(world: World, state: SimState, employeeId: string): number {
  return clamp((world.baseTrust.get(employeeId) ?? 50) + (state.trust.get(employeeId) ?? 0), -100, 100);
}

// ----------------------------------------------------------------------------- scenario generation

export function weekdayOf(world: World, day: number): number {
  return new Date(`${addDaysIso(world.startDate, day - 1)}T00:00:00Z`).getUTCDay();
}

export function isWeekend(world: World, day: number): boolean {
  const w = weekdayOf(world, day);
  return w === 5 || w === 6;
}

function eligible(t: ScenarioTemplate, state: SimState, day: number): boolean {
  if (t.fixedDay !== undefined || t.fixedWeekday !== undefined) return false;
  if (t.minDay !== undefined && day < t.minDay) return false;
  const last = state.lastFired.get(t.code);
  if (t.once && last !== undefined) return false;
  if (t.cooldown !== undefined && last !== undefined && day - last < t.cooldown) return false;
  if (t.requires) {
    const set = state.flags.get(t.requires.flag);
    if (set === undefined || day - set < t.requires.afterDays) return false;
  }
  return true;
}

function pickBranch(world: World, state: SimState, t: ScenarioTemplate, rng: ReturnType<typeof createRng>, taken: Set<string>): string | null {
  if (t.branch === "none") return null;
  const pool = world.branches.filter((b) => !taken.has(b.id));
  if (pool.length === 0) return null;
  if (t.branch === "random") return rng.pick(pool).id;
  const value = (b: WorldBranch) => {
    const m = currentMetrics(world, state, b.id);
    switch (t.branch) {
      case "lowestStock":
        return m.stockAvailability;
      case "highestExpiry":
        return -fieldValue(m, "expiry");
      case "lowestCsat":
        return m.customerSatisfaction;
      case "lowestCompliance":
        return m.complianceScore;
      case "lowestAchievement":
        return fieldValue(m, "sales");
      case "topAchievement":
        return -fieldValue(m, "sales");
      default:
        return 0;
    }
  };
  const ranked = [...pool].sort((a, b) => value(a) - value(b) || a.number - b.number).slice(0, 3);
  return rng.weightedSample(ranked, [3, 2, 1].slice(0, ranked.length), 1)[0]!.id;
}

function instantiate(world: World, state: SimState, t: ScenarioTemplate, day: number, rng: ReturnType<typeof createRng>, taken: Set<string>): ScenarioInstance | null {
  const branchId = pickBranch(world, state, t, rng, taken);
  if (t.branch !== "none" && !branchId) return null;
  const people: Partial<Record<RoleRef, string>> = { ...world.people };
  if (branchId) {
    const b = world.branches.find((x) => x.id === branchId)!;
    people.leader = b.leaderId;
    if (t.staff && b.staffIds.length) people.staff = t.staff === "top" ? b.staffIds[0] : rng.pick(b.staffIds);
    taken.add(branchId);
  }
  return { id: `d${day}-${t.code}`, code: t.code, day, branchId, people };
}

/** Scenarios for a day, given the state at the start of that day. Deterministic. */
export function generateDay(world: World, state: SimState, day: number): ScenarioInstance[] {
  if (isWeekend(world, day)) return [];
  const rng = createRng(`simulation:day:${day}`);
  const weekday = weekdayOf(world, day);
  const fixed = SCENARIOS.filter((t) => t.fixedDay === day || (t.fixedWeekday === weekday && t.fixedDay === undefined));
  const pool = SCENARIOS.filter((t) => eligible(t, state, day));
  // Flag-triggered follow-ups take priority so that earlier choices visibly come back.
  const followUps = pool.filter((t) => t.requires);
  const regular = pool.filter((t) => !t.requires);
  const target = Math.max(fixed.length, rng.chance(0.45) ? 2 : 1) + (day === 1 ? 1 : 0);
  const picked: ScenarioTemplate[] = [...fixed, ...followUps].slice(0, Math.max(target, fixed.length));
  const remaining = Math.max(0, target - picked.length);
  if (remaining > 0 && regular.length) {
    picked.push(...rng.weightedSample(regular, regular.map((t) => t.weight), Math.min(remaining, regular.length)));
  }
  const taken = new Set<string>();
  return picked.map((t) => instantiate(world, state, t, day, rng, taken)).filter((x): x is ScenarioInstance => x !== null);
}

// ----------------------------------------------------------------------------- applying effects

function trustFactor(world: World, state: SimState, who: string | undefined): number {
  if (!who) return 1;
  const t = trustOf(world, state, who);
  return t >= 65 ? 1.25 : t < 35 ? 0.75 : 1;
}

function applyEffects(
  world: World,
  state: SimState,
  inst: ScenarioInstance | null,
  effects: Effect[],
  day: number,
  metricFactor = 1,
  branchOverride?: string,
): AppliedEffect[] {
  const applied: AppliedEffect[] = [];
  const branchId = branchOverride ?? inst?.branchId ?? null;
  for (const e of effects) {
    if (e.kind === "metric") {
      const targets = e.scope === "area" ? world.branches.map((b) => b.id) : branchId ? [branchId] : [];
      for (const id of targets) {
        const before = fieldValue(currentMetrics(world, state, id), e.field);
        const d = state.deltas.get(id) ?? zeroDelta();
        d[e.field] = round(d[e.field] + e.delta * metricFactor, 4);
        state.deltas.set(id, d);
        const after = fieldValue(currentMetrics(world, state, id), e.field);
        if (e.scope === "branch") applied.push({ kind: "metric", target: id, field: e.field, before, after });
      }
      if (e.scope === "area") applied.push({ kind: "metric", target: "area", field: e.field, before: 0, after: round(e.delta * metricFactor, 2) });
    } else if (e.kind === "trust") {
      const id = inst?.people[e.who];
      if (!id) continue;
      const before = trustOf(world, state, id);
      state.trust.set(id, (state.trust.get(id) ?? 0) + e.delta);
      applied.push({ kind: "trust", target: id, field: "trust", before, after: trustOf(world, state, id) });
    } else if (e.kind === "memory") {
      const id = inst?.people[e.who];
      if (id) state.memories.push({ employeeId: id, day, type: e.type, text: e.text, salience: e.salience, instance: inst });
    } else {
      state.flags.set(e.flag, day);
    }
  }
  return applied;
}

function addDna(state: SimState, dna: Partial<Record<DnaDimension, number>> | undefined) {
  for (const [k, v] of Object.entries(dna ?? {})) state.dna[k as DnaDimension] += v ?? 0;
}

export function resolveScenario(world: World, state: SimState, inst: ScenarioInstance, option: number | null): DecisionRecord {
  const t = SCENARIO_BY_CODE.get(inst.code)!;
  const chosen: ScenarioOption | null = option === null ? null : t.options[option]!;
  const effects = chosen ? chosen.effects : t.ignored.effects;
  const dna = (chosen ? chosen.dna : t.ignored.dna) ?? {};
  const factor = chosen?.trustScaled ? trustFactor(world, state, inst.people[chosen.trustScaled]) : 1;
  const applied = applyEffects(world, state, inst, effects, inst.day, factor);
  addDna(state, dna);
  const record: DecisionRecord = { instance: inst, option, day: inst.day, dna, effects: applied };
  state.decisions.push(record);
  state.lastFired.set(inst.code, inst.day);
  return record;
}

function startCoaching(world: World, state: SimState, branchCode: string, focus: CoachingFocus, day: number): boolean {
  const b = world.branches.find((x) => x.code === branchCode);
  if (!b) return false;
  const active = state.coaching.filter((c) => c.status === "active");
  if (active.length >= MAX_ACTIVE_COACHING || active.some((c) => c.branchId === b.id)) return false;
  state.coaching.push({ branchId: b.id, leaderId: b.leaderId, focus, startDay: day, endDay: day + COACHING_DAYS - 1, status: "active" });
  state.trust.set(b.leaderId, (state.trust.get(b.leaderId) ?? 0) + 3);
  state.dna.people += 1;
  state.memories.push({
    employeeId: b.leaderId,
    day,
    type: "commitment",
    text: { en: "Agreed a one-week coaching plan with the supervisor.", ar: "اتفق مع المشرف على خطة توجيه لمدة أسبوع." },
    salience: 55,
    instance: null,
  });
  return true;
}

function closeDay(world: World, state: SimState, day: number) {
  for (const inst of state.events.get(day) ?? []) {
    if (!state.decisions.some((d) => d.instance.id === inst.id)) resolveScenario(world, state, inst, null);
  }
  for (const plan of state.coaching) {
    if (plan.status !== "active" || day < plan.startDay) continue;
    const { field, delta } = COACHING_DAILY[plan.focus];
    applyEffects(world, state, null, [{ kind: "metric", scope: "branch", field, delta }], day, trustFactor(world, state, plan.leaderId), plan.branchId);
    if (day >= plan.endDay) {
      plan.status = "completed";
      state.trust.set(plan.leaderId, (state.trust.get(plan.leaderId) ?? 0) + 4);
      state.dna.people += 1;
      state.memories.push({
        employeeId: plan.leaderId,
        day,
        type: "recognition",
        text: { en: "Completed a coaching plan with the supervisor's support.", ar: "أكمل خطة توجيه بدعم من المشرف." },
        salience: 65,
        instance: null,
      });
    }
  }
}

// ----------------------------------------------------------------------------- replay

export interface SimulationRun {
  world: World;
  state: SimState;
  /** Today's scenarios (empty once the simulation is completed). */
  today: ScenarioInstance[];
  /** Today's scenarios still waiting for a decision. */
  pending: ScenarioInstance[];
}

export function runSimulation(world: World, progress: Progress): SimulationRun {
  const state = initialState();
  const lastDay = Math.min(Math.max(1, progress.day), world.lengthDays + 1);
  for (let day = 1; day <= Math.min(lastDay, world.lengthDays); day++) {
    state.day = day;
    const events = generateDay(world, state, day);
    state.events.set(day, events);
    for (const inst of events) state.lastFired.set(inst.code, day);
    for (const dec of progress.decisions) {
      if (dec.day !== day) continue;
      const inst = events.find((e) => e.code === dec.code);
      const t = SCENARIO_BY_CODE.get(dec.code);
      if (!inst || !t || dec.option < 0 || dec.option >= t.options.length) continue;
      if (state.decisions.some((d) => d.instance.id === inst.id)) continue;
      resolveScenario(world, state, inst, dec.option);
    }
    for (const c of progress.coaching) if (c.day === day) startCoaching(world, state, c.branchCode, c.focus, day);
    if (day < lastDay) closeDay(world, state, day);
  }
  state.day = Math.min(lastDay, world.lengthDays);
  state.completed = lastDay > world.lengthDays;
  const today = state.completed ? [] : (state.events.get(state.day) ?? []);
  const pending = today.filter((e) => !state.decisions.some((d) => d.instance.id === e.id));
  return { world, state, today, pending };
}

export function isValidCoachingStart(run: SimulationRun, branchCode: string, focus: string): boolean {
  if (run.state.completed || !(COACHING_FOCUS as readonly string[]).includes(focus)) return false;
  const b = run.world.branches.find((x) => x.code === branchCode);
  if (!b) return false;
  const active = run.state.coaching.filter((c) => c.status === "active");
  return active.length < MAX_ACTIVE_COACHING && !active.some((c) => c.branchId === b.id);
}
