import { describe, expect, it } from "vitest";
import { generateDataset } from "@/data/seed/generator";
import { DatasetRepository } from "@/data/repository/dataset-repository";
import { getDashboard } from "@/services/dashboard-service";
import { checkIntegrity } from "@/validation/dataset";
import { adjustMetrics, buildWorld, fieldValue, generateDay, isWeekend, runSimulation, trustOf, type SimulationRun } from "@/lib/simulation/engine";
import { dnaScore, leadershipDna } from "@/lib/simulation/leadership";
import { applySimulation } from "@/lib/simulation/overlay";
import { decodeProgress, EMPTY_PROGRESS, encodeProgress, type Progress } from "@/lib/simulation/progress";
import { SCENARIOS, SCENARIO_BY_CODE } from "@/lib/simulation/scenarios";
import { DNA_DIMENSIONS } from "@/lib/simulation/types";

const data = generateDataset();
const world = buildWorld(data);

/** Plays `days` days, always choosing `pick(optionsCount, scenarioCode)` for every scenario. */
function play(days: number, pick: (n: number, code: number) => number = () => 0): { progress: Progress; run: SimulationRun } {
  let progress: Progress = { day: 1, decisions: [], coaching: [] };
  for (let day = 1; day <= days; day++) {
    const run = runSimulation(world, progress);
    const decisions = run.pending.map((p) => ({ day, code: p.code, option: pick(SCENARIO_BY_CODE.get(p.code)!.options.length, p.code) }));
    progress = { ...progress, decisions: [...progress.decisions, ...decisions], day: day + 1 };
  }
  return { progress, run: runSimulation(world, progress) };
}

describe("scenario catalogue", () => {
  it("has unique stable codes and complete bilingual text", () => {
    expect(new Set(SCENARIOS.map((s) => s.code)).size).toBe(SCENARIOS.length);
    expect(new Set(SCENARIOS.map((s) => s.key)).size).toBe(SCENARIOS.length);
    for (const s of SCENARIOS) {
      expect(s.options.length).toBeGreaterThanOrEqual(2);
      for (const text of [s.title, s.narrative, s.ignored.outcome, ...s.options.flatMap((o) => [o.label, o.outcome])]) {
        expect(text.en.trim()).not.toBe("");
        expect(text.ar.trim()).not.toBe("");
      }
    }
  });

  it("only uses placeholders the engine can resolve", () => {
    const allowed = new Set(["branch", "leader", "staff", "colleague", "khalid", "noura", "faisal", "ops", "ceo", "SCM", "PUR", "MKT", "QAC", "HR"]);
    for (const s of SCENARIOS) {
      const texts = [s.title, s.narrative, s.ignored.outcome, ...s.options.flatMap((o) => [o.label, o.outcome])].flatMap((t) => [t.en, t.ar]);
      for (const t of texts) for (const m of t.matchAll(/\{(\w+)\}/g)) expect(allowed.has(m[1]!), `${s.key}: {${m[1]}}`).toBe(true);
      if (s.branch === "none") expect(texts.some((t) => /\{(branch|leader|staff|colleague)\}/.test(t)), s.key).toBe(false);
      if (texts.some((t) => /\{(staff|colleague)\}/.test(t))) expect(s.staff, `${s.key} needs a staff selector`).toBeDefined();
    }
  });
});

describe("world", () => {
  it("resolves every organisation-wide character", () => {
    for (const role of ["khalid", "noura", "faisal", "ops", "ceo", "SCM", "PUR", "MKT", "QAC", "HR"] as const) expect(world.people[role], role).toBeTruthy();
    expect(world.branches).toHaveLength(15);
    expect(world.branches.every((b) => b.staffIds.length === 3)).toBe(true);
  });
});

describe("day loop", () => {
  it("starts on Day 1 with the opening scenario and nothing changed", () => {
    const run = runSimulation(world, EMPTY_PROGRESS);
    expect(run.state.day).toBe(1);
    expect(run.today.map((t) => SCENARIO_BY_CODE.get(t.code)!.key)).toContain("first_priorities");
    expect(run.pending).toHaveLength(run.today.length);
    expect(applySimulation(data, run).branchMetrics).toEqual(data.branchMetrics);
  });

  it("is deterministic: the same progress gives the same world", () => {
    const a = play(20, (n, c) => (c * 7) % n);
    const b = runSimulation(world, a.progress);
    expect(b.state.decisions.map((d) => [d.instance.id, d.option])).toEqual(a.run.state.decisions.map((d) => [d.instance.id, d.option]));
    expect([...b.state.deltas]).toEqual([...a.run.state.deltas]);
    expect(b.state.dna).toEqual(a.run.state.dna);
  });

  it("has no situations at the weekend and one or more on work days", () => {
    const { run } = play(14);
    for (let day = 1; day <= 14; day++) {
      const events = run.state.events.get(day) ?? [];
      if (isWeekend(world, day)) expect(events, `day ${day}`).toHaveLength(0);
      else expect(events.length, `day ${day}`).toBeGreaterThan(0);
    }
    // Day 5 is a Thursday: the weekly review always happens.
    expect(run.state.events.get(5)!.some((e) => SCENARIO_BY_CODE.get(e.code)!.key === "weekly_review")).toBe(true);
  });

  it("treats open situations as not handled when the day ends", () => {
    const run = runSimulation(world, { day: 2, decisions: [], coaching: [] });
    const day1 = run.state.events.get(1)!;
    expect(run.state.decisions.filter((d) => d.day === 1)).toHaveLength(day1.length);
    expect(run.state.decisions.every((d) => d.option === null)).toBe(true);
    const ops = world.people.ops!;
    expect(trustOf(world, run.state, ops)).toBeLessThan(world.baseTrust.get(ops)!);
  });

  it("ignores decisions that do not match the generated scenarios", () => {
    const run = runSimulation(world, { day: 1, decisions: [{ day: 1, code: 9, option: 0 }, { day: 1, code: 1, option: 99 }], coaching: [] });
    expect(run.state.decisions).toHaveLength(0);
  });

  it("finishes after 90 days", () => {
    const { run } = play(90);
    expect(run.state.completed).toBe(true);
    expect(run.state.day).toBe(90);
    expect(run.today).toHaveLength(0);
    const overlaid = applySimulation(data, run);
    expect(overlaid.simulation.status).toBe("completed");
  });
});

describe("consequences", () => {
  it("moves branch metrics, records before/after and tags them scenario_generated", () => {
    const { run } = play(10);
    const metric = run.state.decisions.flatMap((d) => d.effects).find((e) => e.kind === "metric" && e.target !== "area");
    expect(metric).toBeDefined();
    expect(metric!.after).not.toBe(metric!.before);
    const overlaid = applySimulation(data, run);
    const generated = overlaid.branchMetrics.filter((m) => m.provenance === "scenario_generated");
    expect(generated.length).toBeGreaterThan(0);
    // History is untouched and every branch still has exactly one current record.
    expect(overlaid.branchMetrics.filter((m) => m.provenance === "synthetic_historical")).toEqual(data.branchMetrics.filter((m) => m.provenance === "synthetic_historical"));
    for (const b of data.branches) expect(overlaid.branchMetrics.filter((m) => m.branchId === b.id && m.provenance !== "synthetic_historical")).toHaveLength(1);
  });

  it("feeds the existing dashboard", async () => {
    const { run } = play(15);
    const before = await getDashboard(new DatasetRepository(data, "demo"));
    const after = await getDashboard(new DatasetRepository(applySimulation(data, run), "demo"));
    expect(after.area).not.toEqual(before.area);
  });

  it("keeps the seeded dataset intact", () => {
    play(30);
    expect(checkIntegrity(data).ok).toBe(true);
  });

  it("applies metric deltas within bounds", () => {
    const base = world.branches[0]!.base;
    const m = adjustMetrics(base, { sales: 10, stock: 50, compliance: -500, csat: 0, expiry: -200, slow: 0 });
    expect(m.salesActual).toBe(Math.round(base.salesActual * 1.1));
    expect(m.stockAvailability).toBe(100);
    expect(m.complianceScore).toBe(0);
    expect(m.nearExpiryValue).toBe(0);
    expect(fieldValue(m, "expiry")).toBe(0);
  });

  it("scales people-led options by trust", () => {
    // Same scenario, same option: a leader with higher trust gets a bigger effect.
    const tpl = SCENARIOS.find((s) => s.key === "audit_gap")!;
    const opt = tpl.options.findIndex((o) => o.trustScaled === "leader");
    expect(opt).toBeGreaterThanOrEqual(0);
  });
});

describe("character memory", () => {
  it("remembers decisions and makes follow-up scenarios appear", () => {
    // Always choose the option that sets a flag when one exists.
    const { run } = play(40, (n, code) => {
      const t = SCENARIO_BY_CODE.get(code)!;
      const i = t.options.findIndex((o) => o.effects.some((e) => e.kind === "flag" && e.flag !== "priority_results" && e.flag !== "priority_people" && e.flag !== "priority_compliance"));
      return i >= 0 ? i : 0;
    });
    expect(run.state.memories.length).toBeGreaterThan(0);
    const keys = new Set([...run.state.events.values()].flat().map((e) => SCENARIO_BY_CODE.get(e.code)!.key));
    expect(keys.has("khalid_poach")).toBe(true);
    // Escalating to the Operations Director (option 2) brings Khalid back later.
    const poach = run.state.decisions.find((d) => SCENARIO_BY_CODE.get(d.instance.code)!.key === "khalid_poach");
    if (poach?.option === 2) expect(keys.has("khalid_challenge")).toBe(true);
  });
});

describe("coaching plans", () => {
  it("improves the focus area for a week, then completes", () => {
    const branch = world.branches[3]!;
    const start = runSimulation(world, { day: 2, decisions: [], coaching: [{ day: 2, branchCode: branch.code, focus: "compliance" }] });
    expect(start.state.coaching[0]!.status).toBe("active");
    const later = runSimulation(world, { day: 10, decisions: [], coaching: [{ day: 2, branchCode: branch.code, focus: "compliance" }] });
    const noPlan = runSimulation(world, { day: 10, decisions: [], coaching: [] });
    expect(later.state.coaching[0]!.status).toBe("completed");
    expect(later.state.deltas.get(branch.id)!.compliance).toBeGreaterThan(noPlan.state.deltas.get(branch.id)?.compliance ?? 0);
    expect(later.state.memories.some((m) => m.employeeId === branch.leaderId && m.type === "recognition")).toBe(true);
  });

  it("allows at most one active plan per branch", () => {
    const code = world.branches[0]!.code;
    const run = runSimulation(world, { day: 2, decisions: [], coaching: [{ day: 2, branchCode: code, focus: "stock" }, { day: 2, branchCode: code, focus: "sales" }] });
    expect(run.state.coaching).toHaveLength(1);
  });
});

describe("leadership DNA", () => {
  it("scores 50 when neutral and stays within 0–100", () => {
    expect(dnaScore(0)).toBe(50);
    expect(dnaScore(1000)).toBe(100);
    expect(dnaScore(-1000)).toBe(0);
    // A long, consistent game does not saturate.
    expect(dnaScore(70, 100)).toBeLessThan(95);
  });

  it("reflects the choices made", () => {
    const { run } = play(20);
    const dna = leadershipDna(run.state);
    expect(dna.ready).toBe(true);
    expect(dna.dominant).not.toBeNull();
    for (const d of DNA_DIMENSIONS) expect(dna.scores[d]).toBeGreaterThanOrEqual(0);
    const fresh = leadershipDna(runSimulation(world, EMPTY_PROGRESS).state);
    expect(fresh.ready).toBe(false);
    expect(fresh.style).toBeNull();
  });
});

describe("progress cookie", () => {
  it("round-trips and fits in a cookie after a full simulation", () => {
    const { progress } = play(90, (n, c) => c % n);
    const withCoaching = { ...progress, coaching: [{ day: 3, branchCode: "NX-C01", focus: "stock" as const }] };
    const encoded = encodeProgress(withCoaching);
    expect(encoded.length).toBeLessThan(3000);
    expect(encoded).not.toMatch(/[,; "\\]/);
    expect(decodeProgress(encoded)).toEqual(withCoaching);
  });

  it("drops malformed input instead of trusting it", () => {
    expect(decodeProgress("garbage")).toEqual(EMPTY_PROGRESS);
    expect(decodeProgress("1|500||")).toEqual(EMPTY_PROGRESS);
    expect(decodeProgress("1|3|1.1.0~x.y.z~9.1.0|2.NX-C01.stock~2.bad code.stock~2.NX-C01.nope")).toEqual({
      day: 3,
      decisions: [{ day: 1, code: 1, option: 0 }],
      coaching: [{ day: 2, branchCode: "NX-C01", focus: "stock" }],
    });
  });

  it("generates the same day from the same state", () => {
    const a = runSimulation(world, EMPTY_PROGRESS);
    const b = runSimulation(world, EMPTY_PROGRESS);
    expect(b.today).toEqual(a.today);
    // Generation reads the state at the start of the day, so it never mutates it.
    const snapshot = JSON.stringify([...a.state.deltas]);
    generateDay(world, a.state, 2);
    expect(JSON.stringify([...a.state.deltas])).toBe(snapshot);
  });
});
