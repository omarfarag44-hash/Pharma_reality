/**
 * End-of-day report, morning briefing and the Situational Leadership summary.
 *
 * The leadership evaluation is only built for CLOSED days (day < current day),
 * so the player never sees which style "fits" before acting.
 */
import type { Locale } from "@/domain/common";
import type { Employee } from "@/domain/people";
import { fmt, type Dictionary } from "@/lib/i18n";
import { fitFactor } from "@/lib/simulation/characters";
import type { DecisionRecord, SimulationRun } from "@/lib/simulation/engine";
import { SCENARIO_BY_CODE } from "@/lib/simulation/scenarios";
import type { DevelopmentLevel, LeadershipStyle, TaskCode } from "@/lib/simulation/types";
import type { ReactionTone } from "@/lib/simulation/characters";
import { renderText, scenarioView, type ScenarioView, type SimIndex } from "./simulation-service";

export type FitKind = "matched" | "close" | "mismatch" | "none";

export interface LeadershipMoment {
  day: number;
  title: string;
  subject: Employee;
  task: TaskCode;
  competence: number;
  commitment: number;
  level: DevelopmentLevel;
  style: LeadershipStyle | null;
  gap: number | null;
  fit: FitKind;
  /** Plain-language explanation of the fit. */
  explanation: string;
  diagnosis: string;
  reaction: { tone: ReactionTone; line: string; reasons: Array<{ positive: boolean; key: string }> } | null;
}

export interface Change {
  before: number;
  after: number;
}

export interface PersonChange {
  employee: Employee;
  trust: Change | null;
  commitment: Change | null;
}

export interface RelationChange {
  a: Employee;
  b: Employee;
  change: Change;
}

export interface DayReport {
  day: number;
  closed: boolean;
  scenarios: ScenarioView[];
  people: PersonChange[];
  relations: RelationChange[];
  leadership: LeadershipMoment[];
  followUps: string[];
  plans: Array<{ leader: Employee | undefined; focus: string; endDay: number }>;
}

export function fitOf(gap: number | null): FitKind {
  if (gap === null) return "none";
  const d = Math.abs(gap);
  return d === 0 ? "matched" : d === 1 ? "close" : "mismatch";
}

function parseReasons(reasons: string[]) {
  return reasons.map((r) => (r[0] === "+" || r[0] === "-" ? { positive: r[0] === "+", key: r.slice(1) } : { positive: false, key: r }));
}

export function leadershipMoment(d: DecisionRecord, idx: SimIndex, locale: Locale, dict: Dictionary): LeadershipMoment | null {
  const l = d.leadership;
  const subject = l ? idx.employees.get(l.subjectId) : undefined;
  if (!l || !subject) return null;
  const s = dict.sl;
  const t = SCENARIO_BY_CODE.get(d.instance.code)!;
  const name = subject.fullName[locale];
  const fit = fitOf(l.gap);
  const pct = l.gap === null ? 100 : Math.round(fitFactor(l.gap) * 100);
  const explanation =
    l.gap === null
      ? fmt(s.fitExplain.ignored, { name })
      : l.gap === 0
        ? fmt(s.fitExplain.matched, { name, pct: pct - 100 })
        : fmt(l.gap < 0 ? s.fitExplain.over : s.fitExplain.under, { name, pct });
  return {
    day: d.day,
    title: renderText(t.title, d.instance, idx, locale),
    subject,
    task: l.task,
    competence: l.competence,
    commitment: l.commitment,
    level: l.level,
    style: l.style,
    gap: l.gap,
    fit,
    explanation,
    diagnosis: fmt(s.diagnosis, { name, task: s.taskLabel[l.task], c: l.competence.toFixed(1), m: l.commitment, level: s.levelName[l.level] }),
    reaction: d.reaction ? { tone: d.reaction.tone, line: d.reaction.line[locale], reasons: parseReasons(d.reaction.reasons) } : null,
  };
}

export function dayReport(run: SimulationRun, day: number, idx: SimIndex, locale: Locale, dict: Dictionary): DayReport {
  const { state } = run;
  const closed = day < state.day || state.completed;
  const decisions = state.decisions.filter((d) => d.day === day);
  const instances = state.events.get(day) ?? [];

  const people = new Map<string, PersonChange>();
  const relations = new Map<string, RelationChange>();
  for (const d of decisions) {
    for (const e of d.effects) {
      if (e.kind === "trust" || e.kind === "commitment") {
        const employee = idx.employees.get(e.target);
        if (!employee) continue;
        const p = people.get(e.target) ?? { employee, trust: null, commitment: null };
        const prev = p[e.kind];
        p[e.kind] = { before: prev ? prev.before : e.before, after: e.after };
        people.set(e.target, p);
      } else if (e.kind === "relation") {
        const [ia, ib] = e.target.split("|");
        const a = idx.employees.get(ia!);
        const b = idx.employees.get(ib!);
        if (!a || !b) continue;
        const prev = relations.get(e.target);
        relations.set(e.target, { a, b, change: { before: prev ? prev.change.before : e.before, after: e.after } });
      }
    }
  }

  const followUps = decisions.flatMap((d) => {
    const t = SCENARIO_BY_CODE.get(d.instance.code)!;
    const effects = d.option === null ? t.ignored.effects : t.options[d.option]!.effects;
    return effects.some((e) => e.kind === "flag") ? [fmt(dict.sl.followUpFlag, { title: renderText(t.title, d.instance, idx, locale) })] : [];
  });

  const plans = state.coaching
    .filter((c) => c.startDay <= day && c.endDay > day)
    .map((c) => ({ leader: idx.employees.get(c.leaderId), focus: dict.sim.focusLabel[c.focus], endDay: c.endDay }));

  return {
    day,
    closed,
    scenarios: instances.map((inst) => scenarioView(run, inst, idx, locale)),
    people: [...people.values()].filter((p) => (p.trust && p.trust.after !== p.trust.before) || (p.commitment && p.commitment.after !== p.commitment.before)),
    relations: [...relations.values()].filter((r) => r.change.after !== r.change.before),
    leadership: closed ? decisions.map((d) => leadershipMoment(d, idx, locale, dict)).filter((m): m is LeadershipMoment => m !== null) : [],
    followUps,
    plans,
  };
}

// ----------------------------------------------------------------------------- Situational Leadership summary

export const SL_MIN_MOMENTS = 4;

export interface SlSummary {
  moments: number;
  matched: number;
  overDirecting: number;
  underSupporting: number;
  matchRate: number | null;
  byWeek: Array<{ week: number; moments: number; matchRate: number }>;
  byLevel: Array<{ level: DevelopmentLevel; moments: number; matched: number }>;
  pattern: "overDirecting" | "underSupporting" | "balanced" | "forming";
}

/** Only decisions from closed days, where a style was used with a diagnosed person. */
export function slSummary(run: SimulationRun): SlSummary {
  const { state } = run;
  const records = state.decisions.filter((d) => d.leadership?.gap !== null && d.leadership?.gap !== undefined && (d.day < state.day || state.completed));
  const gaps = records.map((d) => d.leadership!.gap!);
  const matched = gaps.filter((g) => g === 0).length;
  const over = gaps.filter((g) => g < 0).length;
  const under = gaps.filter((g) => g > 0).length;
  const weeks = new Map<number, number[]>();
  for (const d of records) {
    const w = Math.floor((d.day - 1) / 7) + 1;
    weeks.set(w, [...(weeks.get(w) ?? []), d.leadership!.gap!]);
  }
  const levels = (["D1", "D2", "D3", "D4"] as const).map((level) => {
    const list = records.filter((d) => d.leadership!.level === level);
    return { level, moments: list.length, matched: list.filter((d) => d.leadership!.gap === 0).length };
  });
  const pattern =
    records.length < SL_MIN_MOMENTS ? "forming" : over >= under * 2 && over > matched / 2 ? "overDirecting" : under >= over * 2 && under > matched / 2 ? "underSupporting" : "balanced";
  return {
    moments: records.length,
    matched,
    overDirecting: over,
    underSupporting: under,
    matchRate: records.length ? Math.round((matched / records.length) * 100) : null,
    byWeek: [...weeks.entries()].sort((a, b) => a[0] - b[0]).map(([week, g]) => ({ week, moments: g.length, matchRate: Math.round((g.filter((x) => x === 0).length / g.length) * 100) })),
    byLevel: levels,
    pattern,
  };
}

/** Closed-day leadership moments, most recent first. */
export function leadershipMoments(run: SimulationRun, idx: SimIndex, locale: Locale, dict: Dictionary): LeadershipMoment[] {
  const { state } = run;
  return state.decisions
    .filter((d) => d.day < state.day || state.completed)
    .map((d) => leadershipMoment(d, idx, locale, dict))
    .filter((m): m is LeadershipMoment => m !== null)
    .sort((a, b) => b.day - a.day);
}
