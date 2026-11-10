/**
 * Engine-level technical validation (T3, T5b, T6, T7, T8). Logs `[Tn]` evidence lines.
 */
import { describe, expect, it } from "vitest";
import { generateDataset } from "@/data/seed/generator";
import { buildWorld, runSimulation, trustOf, type ScenarioInstance } from "@/lib/simulation/engine";
import { applySimulation } from "@/lib/simulation/overlay";
import { SCENARIO_BY_CODE } from "@/lib/simulation/scenarios";
import type { Progress } from "@/lib/simulation/progress";

const data = generateDataset();
const world = buildWorld(data);
const name = (id: string) => data.employees.find((e) => e.id === id)!.fullName.en;

/** Plays until `key` appears, taking option 0 elsewhere; returns the progress with that scenario pending. */
function playUntil(key: string, maxDays = 40): { progress: Progress; inst: ScenarioInstance } {
  let progress: Progress = { day: 1, decisions: [], coaching: [] };
  for (let day = 1; day <= maxDays; day++) {
    const run = runSimulation(world, progress);
    const target = run.pending.find((p) => SCENARIO_BY_CODE.get(p.code)!.key === key);
    const others = run.pending.filter((p) => p !== target).map((p) => ({ day, code: p.code, option: 0 }));
    progress = { ...progress, decisions: [...progress.decisions, ...others] };
    if (target) return { progress, inst: target };
    progress = { ...progress, day: day + 1 };
  }
  throw new Error(`${key} never appeared`);
}

describe("technical validation", () => {
  it("T5b: trust in a leader changes the result of the same people-led choice", () => {
    const { progress, inst } = playUntil("audit_gap");
    const leader = inst.people.leader!;
    const run = runSimulation(world, { ...progress, decisions: [...progress.decisions, { day: inst.day, code: inst.code, option: 1 }] });
    const gain = run.state.decisions.at(-1)!.effects.find((e) => e.field === "compliance")!;
    const trust = trustOf(world, runSimulation(world, progress).state, leader);
    const expected = trust >= 65 ? 3.5 * 1.25 : trust < 35 ? 3.5 * 0.75 : 3.5;
    console.log(`[T5b] ${name(leader)} trust ${trust} → compliance gain ${(gain.after - gain.before).toFixed(1)} (base 3.5, factor ${expected / 3.5})`);
    expect(gain.after - gain.before).toBeCloseTo(expected, 0);
  });

  it("T6: one decision about Khalid changes your relationship with Khalid AND the Operations Director", () => {
    const { progress, inst } = playUntil("khalid_poach");
    const base = runSimulation(world, progress);
    const after = runSimulation(world, { ...progress, decisions: [...progress.decisions, { day: inst.day, code: inst.code, option: 2 }] });
    const people = ["khalid", "ops", "staff"] as const;
    for (const role of people) {
      const id = inst.people[role]!;
      console.log(`[T6] ${role} ${name(id)}: trust ${trustOf(world, base.state, id)} → ${trustOf(world, after.state, id)}`);
    }
    expect(trustOf(world, after.state, inst.people.khalid!)).toBeLessThan(trustOf(world, base.state, inst.people.khalid!));
    expect(trustOf(world, after.state, inst.people.ops!)).toBeLessThan(trustOf(world, base.state, inst.people.ops!));
    // Relationships between two non-player characters are NOT changed by the engine (known gap).
    const npcPairs = (d: typeof data) => d.relationships.filter((r) => r.sourceId !== world.playerId && r.targetId !== world.playerId).map((r) => r.trust);
    expect(npcPairs(applySimulation(data, after))).toEqual(npcPairs(data));
    console.log("[T6] NPC↔NPC relationships unchanged (not modelled yet)");
    // And the follow-up story appears because Khalid remembers the escalation.
    let p: Progress = { ...progress, decisions: [...progress.decisions, { day: inst.day, code: inst.code, option: 2 }] };
    let found = 0;
    for (let day = inst.day; day < inst.day + 15 && !found; day++) {
      const run = runSimulation(world, { ...p, day });
      const challenge = run.today.find((e) => SCENARIO_BY_CODE.get(e.code)!.key === "khalid_challenge");
      if (challenge) found = day;
      p = { ...p, day, decisions: [...p.decisions, ...run.pending.filter((x) => x !== challenge).map((x) => ({ day, code: x.code, option: 0 }))] };
    }
    console.log(`[T6] escalation on day ${inst.day} → Khalid challenges you publicly on day ${found}`);
    expect(found).toBeGreaterThan(inst.day);
  });

  it("T7: each option of the same situation produces different consequences", () => {
    const { progress, inst } = playUntil("stockout");
    const t = SCENARIO_BY_CODE.get(inst.code)!;
    const results = t.options.map((_, option) => {
      const run = runSimulation(world, { ...progress, decisions: [...progress.decisions, { day: inst.day, code: inst.code, option }] });
      const r = run.state.decisions.at(-1)!;
      return JSON.stringify({ effects: r.effects, dna: r.dna, memories: run.state.memories.length, flags: [...run.state.flags.keys()] });
    });
    results.forEach((r, i) => console.log(`[T7] stockout option ${i + 1}: ${r}`));
    expect(new Set(results).size).toBe(t.options.length);
  });

  it("T8: every memory traces back to a recorded decision or coaching plan; nothing random", () => {
    const { progress } = playUntil("khalid_poach");
    const run = runSimulation(world, progress);
    const fresh = runSimulation(world, { day: 1, decisions: [], coaching: [] });
    expect(fresh.state.memories).toHaveLength(0);
    for (const m of run.state.memories) {
      const decision = run.state.decisions.find((d) => d.instance.id === m.instance?.id);
      expect(decision, `memory "${m.text.en}" has a source decision`).toBeDefined();
      const t = SCENARIO_BY_CODE.get(decision!.instance.code)!;
      const effects = decision!.option === null ? t.ignored.effects : t.options[decision!.option]!.effects;
      // Either written in the chosen option, or the Character Engine's own memory of a strong reaction.
      const fromOption = effects.some((e) => e.kind === "memory" && e.text.en === m.text.en);
      const fromReaction = decision!.reaction?.subjectId === m.employeeId && ["appreciative", "hurt"].includes(decision!.reaction.tone);
      expect(fromOption || fromReaction, `memory "${m.text.en}"`).toBe(true);
    }
    const again = runSimulation(world, progress);
    expect(again.state.memories.map((m) => m.text.en)).toEqual(run.state.memories.map((m) => m.text.en));
    console.log(`[T8] ${run.state.memories.length} memories after ${run.state.decisions.length} decisions; each linked to its source decision; replay identical`);
  });
});
