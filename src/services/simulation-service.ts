/**
 * View models for the simulation screens. Resolves people and branches,
 * fills {placeholders} in scenario text and formats applied effects.
 */
import type { Branch } from "@/domain/branch";
import type { Locale, LocalizedText } from "@/domain/common";
import type { Employee } from "@/domain/people";
import type { OrgRepository } from "@/data/repository/types";
import { formatNumber } from "@/lib/i18n/format";
import { trustOf, type AppliedEffect, type DecisionRecord, type Memory, type ScenarioInstance, type SimulationRun } from "@/lib/simulation/engine";
import { SCENARIO_BY_CODE } from "@/lib/simulation/scenarios";
import type { MetricField, RoleRef, ScenarioTemplate } from "@/lib/simulation/types";

export interface SimIndex {
  employees: Map<string, Employee>;
  branches: Map<string, Branch>;
}

export async function getSimIndex(repo: OrgRepository): Promise<SimIndex> {
  const [employees, branches] = await Promise.all([repo.listEmployees(), repo.listBranches()]);
  return { employees: new Map(employees.map((e) => [e.id, e])), branches: new Map(branches.map((b) => [b.id, b])) };
}

/** Fills {branch}, {leader}, {khalid}… with names in the requested language. */
export function renderText(text: LocalizedText, inst: ScenarioInstance | null, idx: SimIndex, locale: Locale): string {
  return text[locale].replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key === "branch") {
      const b = inst?.branchId ? idx.branches.get(inst.branchId) : undefined;
      return b ? b.name[locale] : match;
    }
    const id = inst?.people[key as RoleRef];
    const e = id ? idx.employees.get(id) : undefined;
    return e ? e.fullName[locale] : match;
  });
}

export interface EffectView {
  kind: "metric" | "trust";
  field: MetricField | "trust";
  /** Branch code, person name or "area". */
  target: string;
  targetHref: string | null;
  before: string;
  after: string;
  /** For area-wide effects only before/after are not meaningful; `change` is shown instead. */
  change: string | null;
  direction: "up" | "down" | "flat";
  /** True when the change is good for the player (lower near-expiry stock is good). */
  positive: boolean;
}

const DIGITS: Record<MetricField | "trust", number> = { sales: 1, stock: 1, compliance: 1, csat: 1, expiry: 2, slow: 2, trust: 0 };
const UNIT: Record<MetricField | "trust", string> = { sales: "%", stock: "%", compliance: "", csat: "", expiry: "%", slow: "%", trust: "" };

export function effectView(e: AppliedEffect, idx: SimIndex, locale: Locale): EffectView {
  const lowerIsBetter = e.field === "expiry" || e.field === "slow";
  const diff = e.after - e.before;
  const f = (v: number) => `${formatNumber(v, locale, DIGITS[e.field])}${UNIT[e.field]}`;
  const sign = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "");
  if (e.kind === "metric" && e.target === "area") {
    const unit = e.field === "sales" || e.field === "expiry" || e.field === "slow" ? "%" : "";
    return {
      kind: "metric",
      field: e.field,
      target: "area",
      targetHref: null,
      before: "",
      after: "",
      change: `${sign(e.after)}${formatNumber(Math.abs(e.after), locale, 1)}${unit}`,
      direction: e.after > 0 ? "up" : e.after < 0 ? "down" : "flat",
      positive: lowerIsBetter ? e.after < 0 : e.after > 0,
    };
  }
  const branch = e.kind === "metric" ? idx.branches.get(e.target) : undefined;
  const person = e.kind === "trust" ? idx.employees.get(e.target) : undefined;
  return {
    kind: e.kind,
    field: e.field,
    target: branch ? branch.code : person ? person.fullName[locale] : e.target,
    targetHref: branch ? `/${locale}/branches/${branch.code}` : person ? `/${locale}/people/${person.id}` : null,
    before: f(e.before),
    after: f(e.after),
    change: null,
    direction: Math.abs(diff) < 1e-9 ? "flat" : diff > 0 ? "up" : "down",
    positive: lowerIsBetter ? diff < 0 : diff > 0,
  };
}

export interface PersonInScenario {
  employee: Employee;
  trust: number;
  memories: Array<{ text: string; type: Memory["type"]; day: number }>;
}

export interface ScenarioView {
  id: string;
  day: number;
  template: ScenarioTemplate;
  title: string;
  narrative: string;
  branch: Branch | null;
  people: PersonInScenario[];
  options: Array<{ index: number; label: string }>;
  decision: { option: number | null; label: string | null; outcome: string; effects: EffectView[] } | null;
}

export function memoriesOf(run: SimulationRun, employeeId: string, idx: SimIndex, locale: Locale, exceptInstance?: string) {
  return run.state.memories
    .filter((m) => m.employeeId === employeeId && m.instance?.id !== exceptInstance)
    .sort((a, b) => b.day - a.day || b.salience - a.salience)
    .map((m) => ({ text: renderText(m.text, m.instance, idx, locale), type: m.type, day: m.day, salience: m.salience }));
}

export function decisionView(d: DecisionRecord, idx: SimIndex, locale: Locale): NonNullable<ScenarioView["decision"]> {
  const t = SCENARIO_BY_CODE.get(d.instance.code)!;
  const chosen = d.option === null ? null : t.options[d.option]!;
  return {
    option: d.option,
    label: chosen ? renderText(chosen.label, d.instance, idx, locale) : null,
    outcome: renderText(chosen ? chosen.outcome : t.ignored.outcome, d.instance, idx, locale),
    effects: d.effects.filter((e) => Math.abs(e.after - e.before) > 1e-9 || e.target === "area").map((e) => effectView(e, idx, locale)),
  };
}

export function scenarioView(run: SimulationRun, inst: ScenarioInstance, idx: SimIndex, locale: Locale): ScenarioView {
  const t = SCENARIO_BY_CODE.get(inst.code)!;
  const record = run.state.decisions.find((d) => d.instance.id === inst.id);
  const people = t.people
    .map((role) => inst.people[role])
    .filter((id, i, all): id is string => !!id && all.indexOf(id) === i)
    .map((id) => idx.employees.get(id))
    .filter((e): e is Employee => !!e)
    .map((employee) => ({
      employee,
      trust: trustOf(run.world, run.state, employee.id),
      memories: memoriesOf(run, employee.id, idx, locale, inst.id).slice(0, 2),
    }));
  return {
    id: inst.id,
    day: inst.day,
    template: t,
    title: renderText(t.title, inst, idx, locale),
    narrative: renderText(t.narrative, inst, idx, locale),
    branch: inst.branchId ? (idx.branches.get(inst.branchId) ?? null) : null,
    people,
    options: t.options.map((o, index) => ({ index, label: renderText(o.label, inst, idx, locale) })),
    decision: record ? decisionView(record, idx, locale) : null,
  };
}

/** All decisions (most recent first), for the decision log. */
export function decisionLog(run: SimulationRun, idx: SimIndex, locale: Locale) {
  return [...run.state.decisions]
    .sort((a, b) => b.day - a.day || b.instance.id.localeCompare(a.instance.id))
    .map((d) => ({ ...scenarioView(run, d.instance, idx, locale), dna: d.dna }));
}
