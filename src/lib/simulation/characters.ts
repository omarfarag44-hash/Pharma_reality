/**
 * Character Engine (Sprint 3): ONE deterministic engine for every character.
 *
 * Characters are data (Big Five personality, motivators, stress triggers,
 * communication style, skills, experience). They are not prompts. The engine
 * reads that data, the person's trust in the player and their memories of
 * past interactions, and decides:
 *
 *  1. their development level for a specific task (Situational Leadership), and
 *  2. how they react to what the supervisor just did (tone, trust, commitment, words).
 *
 * All rules are documented here and covered by unit tests. Nothing is random.
 */
import type { LocalizedText } from "@/domain/common";
import type { OrgDataset } from "@/domain/dataset";
import type { PersonalityProfile } from "@/domain/people";
import type { ActionTag, DevelopmentLevel, LeadershipStyle, TaskCode } from "./types";

export interface CharacterModel {
  id: string;
  personality: PersonalityProfile;
  motivators: string[];
  stressTriggers: string[];
  communicationStyle: string;
  conflictApproach: string;
  skills: Map<string, number>;
  yearsOfExperience: number;
  performanceScore: number;
}

export function buildCharacters(d: OrgDataset): Map<string, CharacterModel> {
  const years = new Map(d.employees.map((e) => [e.id, e.yearsOfExperience]));
  return new Map(
    d.profiles.map((p) => [
      p.employeeId,
      {
        id: p.employeeId,
        personality: p.personality,
        motivators: p.behavior.motivators,
        stressTriggers: p.behavior.stressTriggers,
        communicationStyle: p.communicationStyle,
        conflictApproach: p.behavior.conflictApproach,
        skills: new Map(p.skills.map((s) => [s.code, s.level])),
        yearsOfExperience: years.get(p.employeeId) ?? 0,
        performanceScore: p.performanceScore,
      },
    ]),
  );
}

// ----------------------------------------------------------------------------- Situational Leadership

/** Competencies (1–5 skill ratings) that make up each task. */
export const TASK_COMPETENCIES: Record<TaskCode, string[]> = {
  sales: ["sales_conversion", "cross_selling", "commercial_awareness"],
  clinical: ["clinical_knowledge", "attention_to_detail", "patient_counseling"],
  digital: ["digital_tools", "attention_to_detail"],
  inventory: ["inventory_control", "planning"],
  conflict: ["conflict_resolution", "assertiveness"],
  leadership: ["team_coaching", "delegation", "planning"],
  customer: ["customer_service", "patient_counseling", "stress_management"],
  compliance: ["regulatory_compliance", "attention_to_detail"],
  planning: ["planning", "time_management"],
};

/** Stress triggers that lower commitment on a given task. */
const TASK_STRESSORS: Partial<Record<TaskCode, string[]>> = {
  sales: ["target_pressure"],
  customer: ["difficult_customers"],
  inventory: ["stock_shortages"],
  conflict: ["public_criticism"],
  planning: ["understaffing", "last_minute_changes"],
  leadership: ["unclear_priorities"],
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Task competence on the 1–5 skill scale: the mean of the task's rated skills,
 * −0.5 for under 2 years' experience, +0.3 for 10 years or more.
 */
export function taskCompetence(c: CharacterModel, task: TaskCode): number {
  const levels = TASK_COMPETENCIES[task].map((code) => c.skills.get(code)).filter((v): v is number => v !== undefined);
  const mean = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 3;
  const exp = c.yearsOfExperience < 2 ? -0.5 : c.yearsOfExperience >= 10 ? 0.3 : 0;
  return Math.round(clamp(mean + exp, 1, 5) * 10) / 10;
}

/** Baseline commitment (0–100) from personality and recent performance, before trust and events. */
export function baselineCommitment(c: CharacterModel): number {
  const p = c.personality;
  return 25 + p.conscientiousness * 0.25 + p.emotionalStability * 0.15 + (c.performanceScore - 50) * 0.3;
}

/**
 * Commitment (motivation + confidence) on a task, 0–100:
 * baseline + (trust − 50) × 0.25 + event shifts − 10 when the task hits one of the person's stress triggers.
 */
export function taskCommitment(c: CharacterModel, task: TaskCode, trust: number, shift: number): number {
  const stressed = (TASK_STRESSORS[task] ?? []).some((t) => c.stressTriggers.includes(t));
  return Math.round(clamp(baselineCommitment(c) + (trust - 50) * 0.25 + shift - (stressed ? 10 : 0), 0, 100));
}

/**
 * Development level for one task (Hersey & Blanchard; Blanchard et al., SLII):
 * - D4: competence ≥ 4 and commitment ≥ 60
 * - D3: competence ≥ 3 (and not D4) — capable, commitment variable
 * - D1: competence < 3 and commitment ≥ 55 — enthusiastic beginner
 * - D2: competence < 3 and commitment < 55 — disillusioned learner
 */
export function developmentLevel(competence: number, commitment: number): DevelopmentLevel {
  if (competence >= 4 && commitment >= 60) return "D4";
  if (competence >= 3) return "D3";
  return commitment >= 55 ? "D1" : "D2";
}

/** The matching style for each level: D1→S1, D2→S2, D3→S3, D4→S4. */
export const MATCHING_STYLE: Record<DevelopmentLevel, LeadershipStyle> = { D1: "S1", D2: "S2", D3: "S3", D4: "S4" };

/** 0 = matched; 1 = one step off; 2–3 = clear mismatch. Positive = more hands-off than needed. */
export function styleGap(style: LeadershipStyle, level: DevelopmentLevel): number {
  return Number(style[1]) - Number(level[1]);
}

/** How much the leadership fit multiplies the business effect of the choice. */
export function fitFactor(gap: number): number {
  const d = Math.abs(gap);
  return d === 0 ? 1.3 : d === 1 ? 1 : d === 2 ? 0.7 : 0.5;
}

// ----------------------------------------------------------------------------- reactions

export const REACTION_TONES = ["appreciative", "accepting", "guarded", "resistant", "hurt"] as const;
export type ReactionTone = (typeof REACTION_TONES)[number];

export interface ReactionInput {
  character: CharacterModel;
  trust: number;
  grievances: number;
  recognitions: number;
  tags: ActionTag[];
  /** Situational Leadership gap (null when the action is not a leadership style). */
  gap: number | null;
  competence: number;
}

export interface Reaction {
  score: number;
  tone: ReactionTone;
  trustDelta: number;
  commitmentDelta: number;
  /** The factors that moved the score, for the end-of-day explanation. */
  reasons: string[];
}

/**
 * Scores how the person experiences the action. Each rule is one line:
 * motivators and stress triggers meet the action's tags, then leadership fit,
 * trust and remembered history are added. Low emotional stability amplifies negatives.
 */
export function react(input: ReactionInput): Reaction {
  const { character: c, tags } = input;
  const has = (list: string[], v: string) => list.includes(v);
  let score = 0;
  const reasons: string[] = [];
  const add = (n: number, why: string) => {
    if (n === 0) return;
    score += n;
    reasons.push(`${n > 0 ? "+" : "-"}${why}`);
  };

  if (tags.includes("recognition")) add(has(c.motivators, "recognition") ? 2 : 1, "recognition");
  if (tags.includes("development")) add(has(c.motivators, "growth") || has(c.motivators, "mastery") ? 2 : 1, "development");
  if (tags.includes("autonomy")) add(has(c.motivators, "autonomy") ? 2 : input.competence < 3 ? -1 : 1, "autonomy");
  if (tags.includes("listening")) add(c.personality.agreeableness >= 60 || has(c.motivators, "team_belonging") ? 2 : 1, "listening");
  if (tags.includes("support")) add(c.personality.emotionalStability < 45 ? 2 : 1, "support");
  if (tags.includes("fairness")) add(has(c.motivators, "team_belonging") ? 2 : 1, "fairness");
  if (tags.includes("close_supervision")) add(has(c.stressTriggers, "micromanagement") ? -3 : has(c.motivators, "autonomy") ? -2 : input.competence <= 2 ? 1 : -1, "close_supervision");
  if (tags.includes("public")) add(has(c.stressTriggers, "public_criticism") ? -3 : -1, "public");
  if (tags.includes("formal")) add(c.personality.agreeableness >= 65 ? -2 : -1, "formal");
  if (tags.includes("pressure")) add(has(c.stressTriggers, "target_pressure") ? -3 : -1, "pressure");

  if (input.gap !== null) add(input.gap === 0 ? 2 : Math.abs(input.gap) === 1 ? 0 : -2, "fit");
  add(Math.round((input.trust - 50) / 25), "trust");
  add(-Math.min(2, input.grievances), "grievances");
  add(Math.min(2, input.recognitions), "recognitions");

  if (score < 0 && c.personality.emotionalStability < 40) {
    score = Math.round(score * 1.5);
    reasons.push("low_stability");
  }

  const tone: ReactionTone = score >= 4 ? "appreciative" : score >= 1 ? "accepting" : score >= -1 ? "guarded" : score >= -4 ? "resistant" : "hurt";
  const trustDelta = { appreciative: 4, accepting: 2, guarded: 0, resistant: -3, hurt: -6 }[tone];
  const commitmentDelta = { appreciative: 8, accepting: 4, guarded: 0, resistant: -5, hurt: -10 }[tone];
  return { score, tone, trustDelta, commitmentDelta, reasons };
}

/**
 * What the person says back, by communication style and tone. Templated, not generated:
 * 6 styles × 5 tones, each written for that style's voice.
 */
const LINES: Record<string, Record<ReactionTone, LocalizedText>> = {
  direct: {
    appreciative: { en: "Good call. That's exactly what I needed.", ar: "قرار صحيح. هذا بالضبط ما كنت أحتاجه." },
    accepting: { en: "Fine. I'll get it done.", ar: "تمام. سأنجزها." },
    guarded: { en: "Okay. We'll see if it works.", ar: "حسنًا. سنرى إن كانت ستنجح." },
    resistant: { en: "With respect, I don't agree with this.", ar: "مع احترامي، لا أتفق مع هذا." },
    hurt: { en: "I expected better from you, honestly.", ar: "بصراحة، توقعت منك أفضل من هذا." },
  },
  analytical: {
    appreciative: { en: "That makes sense. The reasoning is clear and I can work with it.", ar: "هذا منطقي. الأسباب واضحة وأستطيع العمل عليها." },
    accepting: { en: "Understood. Can you send me the details in writing?", ar: "مفهوم. هل يمكنك إرسال التفاصيل كتابيًا؟" },
    guarded: { en: "I'd like to see the data behind this before I commit.", ar: "أود أن أرى البيانات وراء هذا قبل أن ألتزم." },
    resistant: { en: "I don't think the numbers support this approach.", ar: "لا أعتقد أن الأرقام تدعم هذا الأسلوب." },
    hurt: { en: "Nobody asked for my analysis. I'll just do as I'm told.", ar: "لم يسألني أحد عن تحليلي. سأنفذ ما يُطلب مني فقط." },
  },
  supportive: {
    appreciative: { en: "Thank you for taking the time. It really helps.", ar: "شكرًا لأنك خصصت الوقت. هذا يساعدني كثيرًا." },
    accepting: { en: "Of course, I'll do my best.", ar: "بالطبع، سأبذل جهدي." },
    guarded: { en: "Alright… I hope the team is okay with it.", ar: "حسنًا… أتمنى أن يتقبل الفريق ذلك." },
    resistant: { en: "I'll do it, but I'm worried about how the team will feel.", ar: "سأفعل ذلك، لكنني قلق من شعور الفريق." },
    hurt: { en: "I thought you'd at least ask me first.", ar: "ظننت أنك ستسألني أولًا على الأقل." },
  },
  expressive: {
    appreciative: { en: "Yes! Leave it with me, this is going to be great.", ar: "رائع! اتركها لي، ستكون النتيجة ممتازة." },
    accepting: { en: "Sure, let's give it a go.", ar: "أكيد، لنجرّب." },
    guarded: { en: "Hmm, not sure about this one, but okay.", ar: "لست متأكدًا من هذه، لكن لا بأس." },
    resistant: { en: "Honestly? This is going to kill the team's energy.", ar: "بصراحة؟ هذا سيقتل حماس الفريق." },
    hurt: { en: "Wow. I really didn't see that coming.", ar: "لم أتوقع هذا أبدًا." },
  },
  reserved: {
    appreciative: { en: "Thank you. I'll follow up by email.", ar: "شكرًا. سأتابع بالبريد." },
    accepting: { en: "Noted.", ar: "تم." },
    guarded: { en: "…Okay.", ar: "…حسنًا." },
    resistant: { en: "I'd prefer not to, but I will.", ar: "أفضّل ألا أفعل، لكنني سأفعل." },
    hurt: { en: "(says nothing, and avoids you for the rest of the day)", ar: "(لا يقول شيئًا، ويتجنبك بقية اليوم)" },
  },
  diplomatic: {
    appreciative: { en: "I really appreciate how you handled this.", ar: "أقدّر فعلًا طريقتك في التعامل مع هذا." },
    accepting: { en: "That works. Let's agree the next step.", ar: "هذا مناسب. لنتفق على الخطوة التالية." },
    guarded: { en: "I see your point. Perhaps we can revisit it later.", ar: "أفهم وجهة نظرك. ربما نعود إليها لاحقًا." },
    resistant: { en: "I understand, but I'm not sure this is the best way.", ar: "أتفهم ذلك، لكنني لست متأكدًا أنها الطريقة الأفضل." },
    hurt: { en: "I'll respect the decision. I just wish I'd been consulted.", ar: "سأحترم القرار. فقط تمنيت لو تمت استشارتي." },
  },
};

export function reactionLine(c: CharacterModel, tone: ReactionTone): LocalizedText {
  return (LINES[c.communicationStyle] ?? LINES.diplomatic)![tone];
}
