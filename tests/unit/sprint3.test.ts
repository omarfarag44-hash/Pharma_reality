/**
 * Sprint 3: Character Engine, Situational Leadership, NPC relationships,
 * leadership stream and knowledge base.
 */
import { describe, expect, it } from "vitest";
import { generateDataset } from "@/data/seed/generator";
import { KNOWLEDGE } from "@/lib/knowledge/frameworks";
import {
  developmentLevel,
  fitFactor,
  MATCHING_STYLE,
  react,
  styleGap,
  taskCompetence,
  type CharacterModel,
} from "@/lib/simulation/characters";
import { buildWorld, diagnose, relationOf, runSimulation, type ScenarioInstance } from "@/lib/simulation/engine";
import { applySimulation } from "@/lib/simulation/overlay";
import type { Progress } from "@/lib/simulation/progress";
import { SCENARIOS, SCENARIO_BY_CODE } from "@/lib/simulation/scenarios";
import { LEADERSHIP_STYLES, TASKS } from "@/lib/simulation/types";
import { slSummary } from "@/services/report-service";

const data = generateDataset();
const world = buildWorld(data);

function playUntil(key: string, option = 0, maxDays = 90): { progress: Progress; inst: ScenarioInstance } {
  let progress: Progress = { day: 1, decisions: [], coaching: [] };
  for (let day = 1; day <= maxDays; day++) {
    const run = runSimulation(world, progress);
    const target = run.pending.find((p) => SCENARIO_BY_CODE.get(p.code)!.key === key);
    const others = run.pending.filter((p) => p !== target).map((p) => ({ day, code: p.code, option: Math.min(option, SCENARIO_BY_CODE.get(p.code)!.options.length - 1) }));
    progress = { ...progress, decisions: [...progress.decisions, ...others] };
    if (target) return { progress, inst: target };
    progress = { ...progress, day: day + 1 };
  }
  throw new Error(`${key} never appeared`);
}

const decide = (progress: Progress, inst: ScenarioInstance, option: number | null) =>
  runSimulation(world, option === null ? { ...progress, day: inst.day + 1 } : { ...progress, decisions: [...progress.decisions, { day: inst.day, code: inst.code, option }] });

const model = (over: Partial<Omit<CharacterModel, "personality">> & { personality?: Partial<CharacterModel["personality"]> }): CharacterModel => ({
  id: "x",
  motivators: [],
  stressTriggers: [],
  communicationStyle: "direct",
  conflictApproach: "collaborating",
  skills: new Map(),
  yearsOfExperience: 5,
  performanceScore: 60,
  ...over,
  personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ...over.personality },
});

describe("Situational Leadership rules", () => {
  it("diagnoses D1–D4 from competence and commitment", () => {
    expect(developmentLevel(2, 70)).toBe("D1");
    expect(developmentLevel(2, 40)).toBe("D2");
    expect(developmentLevel(3.5, 40)).toBe("D3");
    expect(developmentLevel(4.2, 59)).toBe("D3");
    expect(developmentLevel(4.2, 60)).toBe("D4");
  });

  it("matches S1–S4 to D1–D4 and scales the effect by the gap", () => {
    for (const [level, style] of Object.entries(MATCHING_STYLE)) expect(styleGap(style, level as "D1")).toBe(0);
    expect(styleGap("S1", "D4")).toBe(-3); // over-directing
    expect(styleGap("S4", "D1")).toBe(3); // under-supporting
    expect([0, 1, 2, 3].map(fitFactor)).toEqual([1.3, 1, 0.7, 0.5]);
  });

  it("the same person has different development levels on different tasks", () => {
    const varied = [...world.characters.values()].filter((c) => {
      const levels = new Set(TASKS.map((t) => diagnose(world, runSimulation(world, { day: 1, decisions: [], coaching: [] }).state, c.id, t)!.level));
      return levels.size >= 2;
    });
    expect(varied.length).toBeGreaterThan(10);
    const c = varied[0]!;
    const state = runSimulation(world, { day: 1, decisions: [], coaching: [] }).state;
    const row = TASKS.map((t) => `${t}=${diagnose(world, state, c.id, t)!.level}`).join(" ");
    console.log(`[S3] ${data.employees.find((e) => e.id === c.id)!.fullName.en}: ${row}`);
  });

  it("competence comes from the task's skills and experience", () => {
    const c = model({ skills: new Map([["digital_tools", 2], ["attention_to_detail", 3]]), yearsOfExperience: 1 });
    expect(taskCompetence(c, "digital")).toBe(2); // mean 2.5 − 0.5 for < 2 years
  });

  it("the style fit changes the business effect of the same scenario", () => {
    const { progress, inst } = playUntil("branch_visit");
    const run0 = runSimulation(world, progress);
    const level = diagnose(world, run0.state, inst.people.leader!, "compliance")!.level;
    const base = [1.2, 1.1, 1.0, 0.6];
    for (const [i, style] of LEADERSHIP_STYLES.entries()) {
      const r = decide(progress, inst, i).state.decisions.at(-1)!;
      const gain = r.effects.find((e) => e.field === "compliance")!;
      expect(r.leadership!.level).toBe(level);
      expect(r.leadership!.style).toBe(style);
      expect(gain.after - gain.before).toBeCloseTo(base[i]! * fitFactor(styleGap(style, level)), 0);
    }
  });
});

describe("Character Engine reactions", () => {
  const input = (c: CharacterModel) => ({ character: c, trust: 50, grievances: 0, recognitions: 0, tags: ["close_supervision" as const], gap: null, competence: 4 });

  it("the same action is received differently by different personalities", () => {
    const micromanaged = react(input(model({ stressTriggers: ["micromanagement"] })));
    const calm = react(input(model({})));
    expect(micromanaged.score).toBeLessThan(calm.score);
    expect(micromanaged.reasons).toContain("-close_supervision");
  });

  it("low emotional stability amplifies a negative reaction", () => {
    const steady = react({ ...input(model({ stressTriggers: ["micromanagement"] })) });
    const fragile = react({ ...input(model({ stressTriggers: ["micromanagement"], personality: { emotionalStability: 30 } })) });
    expect(fragile.score).toBeLessThan(steady.score);
    expect(fragile.reasons).toContain("low_stability");
  });

  it("history matters: past grievances make the same action land worse", () => {
    const c = model({});
    const fresh = react({ ...input(c), tags: ["listening"] });
    const hurt = react({ ...input(c), tags: ["listening"], grievances: 2 });
    expect(hurt.score).toBe(fresh.score - 2);
  });

  it("a strong reaction becomes a memory linked to the decision", () => {
    const { progress, inst } = playUntil("resisting_feedback");
    const runs = [0, 1, 2, 3].map((o) => decide(progress, inst, o));
    const tones = runs.map((r) => r.state.decisions.at(-1)!.reaction!.tone);
    console.log(`[S3] resisting_feedback tones by style S1..S4: ${tones.join(", ")}`);
    expect(new Set(tones).size).toBeGreaterThan(1);
    for (const r of runs) {
      const rec = r.state.decisions.at(-1)!;
      const auto = r.state.memories.filter((m) => m.instance?.id === inst.id && m.employeeId === rec.reaction!.subjectId && /^(Appreciated|Felt let down)/.test(m.text.en));
      expect(auto.length).toBe(rec.reaction!.tone === "appreciative" || rec.reaction!.tone === "hurt" ? 1 : 0);
    }
  });
});

describe("relationships between characters", () => {
  it("handling a conflict changes the relationship between the two pharmacists, and the overlay shows it", () => {
    const { progress, inst } = playUntil("pharmacist_conflict");
    const a = inst.people.staff!;
    const b = inst.people.colleague!;
    expect(a).not.toBe(b);
    const coached = decide(progress, inst, 1);
    const ignored = decide(progress, inst, null);
    const before = relationOf(world, runSimulation(world, progress).state, a, b);
    console.log(`[S3] relation ${before} → coached ${relationOf(world, coached.state, a, b)}, ignored ${relationOf(world, ignored.state, a, b)}`);
    expect(relationOf(world, coached.state, a, b)).toBe(before + 6);
    expect(relationOf(world, ignored.state, a, b)).toBe(before - 8);
    const pair = (d: typeof data) => d.relationships.find((r) => r.sourceId === a && r.targetId === b)?.trust;
    if (pair(data) !== undefined) expect(pair(applySimulation(data, ignored))).toBe(pair(data)! - 8);
  });
});

describe("leadership stream", () => {
  it("adds at most one leadership situation a day and never on weekends", () => {
    let p: Progress = { day: 1, decisions: [], coaching: [] };
    let total = 0;
    for (let day = 1; day <= 30; day++) {
      const run = runSimulation(world, { ...p, day });
      const stream = run.today.filter((x) => SCENARIO_BY_CODE.get(x.code)!.stream === "leadership");
      expect(stream.length).toBeLessThanOrEqual(1);
      total += stream.length;
      p = { ...p, day, decisions: [...p.decisions, ...run.pending.map((x) => ({ day, code: x.code, option: 0 }))] };
    }
    expect(total).toBeGreaterThan(5);
  });

  it("every leadership-stream scenario with a subject has a task and a style per option", () => {
    for (const t of SCENARIOS.filter((s) => s.stream === "leadership" && s.subject)) {
      expect(t.task, t.key).toBeDefined();
      expect(t.options.map((o) => o.style)).toEqual(["S1", "S2", "S3", "S4"]);
      for (const o of t.options) expect(o.tags?.length, `${t.key}: ${o.label.en}`).toBeGreaterThan(0);
    }
  });

  it("the evaluation only counts closed days", () => {
    const { progress, inst } = playUntil("resisting_feedback");
    const decided: Progress = { ...progress, decisions: [...progress.decisions, { day: inst.day, code: inst.code, option: 1 }] };
    const countBefore = slSummary(runSimulation(world, progress)).moments;
    expect(slSummary(runSimulation(world, decided)).moments).toBe(countBefore);
    const closed = runSimulation(world, { ...decided, day: inst.day + 1 });
    expect(slSummary(closed).moments).toBe(countBefore + 1);
  });
});

describe("knowledge base", () => {
  const features = new Set(["character-engine", "leadership-dna", "coaching-plans", "end-of-day-report"]);
  it("every entry is bilingual, cited, and points to real scenarios or features", () => {
    expect(KNOWLEDGE.length).toBeGreaterThanOrEqual(20);
    const keys = new Set(SCENARIOS.map((s) => s.key));
    for (const e of KNOWLEDGE) {
      expect(e.sources.length, e.id).toBeGreaterThan(0);
      for (const t of [e.name, e.summary, e.criteria, e.recommendation]) {
        expect(t.en.trim()).not.toBe("");
        expect(t.ar.trim()).not.toBe("");
      }
      for (const u of e.usedIn) expect(keys.has(u) || features.has(u), `${e.id} → ${u}`).toBe(true);
      if (e.kind === "teaching" || e.evidence === "limited") expect(e.caution ?? e.usedIn.length === 0, `${e.id} needs a caution`).toBeTruthy();
    }
  });
});
