/**
 * Builds coherent employee profiles from personality, role and context.
 * Traits drive communication style, strengths and development needs so that
 * each of the 60 pharmacists reads as a distinct person rather than a random mix.
 */
import { COMPETENCIES, type CompetencyCode } from "@/domain/catalogs";
import type { LocalizedText } from "@/domain/common";
import type { RoleCode } from "@/domain/organization";
import type {
  BehavioralTraits,
  EmployeeProfile,
  LeadershipPotentialBand,
  PersonalityProfile,
  SkillRating,
} from "@/domain/people";
import { clamp, round, type Rng } from "./random";

const ALL_COMPETENCIES = Object.keys(COMPETENCIES) as CompetencyCode[];

export function generatePersonality(rng: Rng, roleCode: RoleCode): PersonalityProfile {
  const t = (mean: number) => Math.round(rng.normal(mean, 17, 12, 95));
  const leader = roleCode === "branch_leader";
  return {
    openness: t(56),
    conscientiousness: t(leader ? 66 : 57),
    extraversion: t(leader ? 60 : 52),
    agreeableness: t(58),
    emotionalStability: t(leader ? 62 : 55),
  };
}

export function deriveCommunicationStyle(p: PersonalityProfile): string {
  if (p.extraversion >= 65 && p.agreeableness < 50) return "direct";
  if (p.extraversion >= 65) return "expressive";
  if (p.conscientiousness >= 65 && p.extraversion < 48) return "analytical";
  if (p.agreeableness >= 64) return "supportive";
  if (p.extraversion < 38) return "reserved";
  if (p.agreeableness < 48) return "direct";
  if (p.conscientiousness >= 60) return "analytical";
  return "diplomatic";
}

export function deriveConflictApproach(p: PersonalityProfile): BehavioralTraits["conflictApproach"] {
  const highA = p.agreeableness >= 60;
  const highE = p.extraversion >= 55;
  if (highA && highE) return "collaborating";
  if (highA && !highE) return "accommodating";
  if (!highA && highE) return "confronting";
  if (p.agreeableness < 45 && p.extraversion < 45) return "avoiding";
  return "compromising";
}

export function deriveDecisionStyle(p: PersonalityProfile): BehavioralTraits["decisionStyle"] {
  if (p.conscientiousness >= 65) return p.openness >= 60 ? "data_driven" : "rule_based";
  if (p.agreeableness >= 65) return "consensus";
  return "intuitive";
}

function roleWeights(roleCode: RoleCode): Partial<Record<CompetencyCode, number>> {
  switch (roleCode) {
    case "branch_leader":
      return { team_coaching: 3, planning: 3, delegation: 2, conflict_resolution: 2, commercial_awareness: 3, data_literacy: 2, inventory_control: 2, regulatory_compliance: 2 };
    case "senior_pharmacist":
      return { clinical_knowledge: 3, patient_counseling: 3, chronic_care: 2, inventory_control: 2, team_coaching: 1.5, regulatory_compliance: 2 };
    case "junior_pharmacist":
      return { digital_tools: 3, customer_service: 2.5, adaptability: 2.5, clinical_knowledge: 1.5, dermocosmetics: 1.5 };
    case "department_head":
    case "department_specialist":
      return { stakeholder_management: 3, planning: 2.5, data_literacy: 2.5, problem_solving: 2, attention_to_detail: 1.5, digital_tools: 1.5 };
    default:
      return { clinical_knowledge: 2, patient_counseling: 2, chronic_care: 2, dermocosmetics: 2, cross_selling: 2, inventory_control: 1.5, customer_service: 2, attention_to_detail: 1.5 };
  }
}

function strengthWeights(p: PersonalityProfile, roleCode: RoleCode): number[] {
  const base = roleWeights(roleCode);
  return ALL_COMPETENCIES.map((c) => {
    let w = 0.4 + (base[c] ?? 0);
    if (p.conscientiousness >= 65 && ["attention_to_detail", "regulatory_compliance", "inventory_control", "planning", "punctuality"].includes(c)) w += 2;
    if (p.extraversion >= 65 && ["sales_conversion", "cross_selling", "customer_service", "assertiveness"].includes(c)) w += 2;
    if (p.agreeableness >= 65 && ["patient_counseling", "team_coaching", "conflict_resolution", "customer_service"].includes(c)) w += 2;
    if (p.openness >= 65 && ["adaptability", "digital_tools", "problem_solving", "dermocosmetics", "strategic_thinking"].includes(c)) w += 2;
    if (p.emotionalStability >= 68 && ["stress_management", "conflict_resolution"].includes(c)) w += 1.5;
    // Things people with the opposite profile rarely list as strengths.
    if (p.conscientiousness < 45 && ["punctuality", "attention_to_detail", "planning"].includes(c)) w = 0.05;
    if (p.extraversion < 40 && ["assertiveness", "sales_conversion"].includes(c)) w = 0.05;
    if (["delegation", "strategic_thinking", "stakeholder_management", "negotiation"].includes(c) && !["branch_leader", "department_head", "department_specialist"].includes(roleCode)) w *= 0.2;
    return w;
  });
}

function developmentWeights(p: PersonalityProfile, roleCode: RoleCode, recoveryContext: boolean): number[] {
  return ALL_COMPETENCIES.map((c) => {
    let w = 0.3;
    if (p.conscientiousness < 50 && ["punctuality", "time_management", "attention_to_detail", "inventory_control", "planning"].includes(c)) w += 2.5;
    if (p.extraversion < 45 && ["assertiveness", "sales_conversion", "cross_selling"].includes(c)) w += 2.5;
    if (p.agreeableness < 48 && ["conflict_resolution", "team_coaching", "customer_service"].includes(c)) w += 2.5;
    if (p.emotionalStability < 48 && ["stress_management", "adaptability"].includes(c)) w += 2.5;
    if (p.openness < 45 && ["digital_tools", "adaptability", "problem_solving"].includes(c)) w += 2;
    if (roleCode === "branch_leader" && ["delegation", "data_literacy", "team_coaching", "commercial_awareness"].includes(c)) w += 1.5;
    if (roleCode === "junior_pharmacist" && ["clinical_knowledge", "patient_counseling", "commercial_awareness", "time_management"].includes(c)) w += 2;
    if (recoveryContext && ["commercial_awareness", "regulatory_compliance", "inventory_control"].includes(c)) w += 1.2;
    if (["strategic_thinking", "stakeholder_management", "negotiation"].includes(c) && roleCode !== "department_head") w *= 0.2;
    return w;
  });
}

export function pickStrengthsAndGaps(
  rng: Rng,
  p: PersonalityProfile,
  roleCode: RoleCode,
  recoveryContext: boolean,
): { strengths: CompetencyCode[]; developmentAreas: CompetencyCode[] } {
  const strengths = rng.weightedSample(ALL_COMPETENCIES, strengthWeights(p, roleCode), 3);
  const devWeights = developmentWeights(p, roleCode, recoveryContext).map((w, i) =>
    strengths.includes(ALL_COMPETENCIES[i]!) ? 0 : w,
  );
  const devCount = rng.chance(0.55) ? 2 : 3;
  const developmentAreas = rng.weightedSample(ALL_COMPETENCIES, devWeights, devCount);
  return { strengths, developmentAreas };
}

export function buildSkills(rng: Rng, strengths: string[], gaps: string[], roleCode: RoleCode): SkillRating[] {
  const core = ["clinical_knowledge", "patient_counseling", "inventory_control", "customer_service", "regulatory_compliance"];
  const codes = Array.from(new Set([...strengths, ...gaps, ...core]));
  const seniority = roleCode === "junior_pharmacist" ? -1 : roleCode === "branch_leader" || roleCode === "senior_pharmacist" ? 0.5 : 0;
  return codes.map((code) => {
    let level: number;
    if (strengths.includes(code)) level = rng.chance(0.45) ? 5 : 4;
    else if (gaps.includes(code)) level = rng.chance(0.5) ? 1 : 2;
    else level = Math.round(clamp(3 + seniority + rng.float(-0.6, 0.6), 1, 5));
    return { code, level };
  });
}

export function leadershipPotential(
  p: PersonalityProfile,
  performance: number,
  years: number,
): { score: number; band: LeadershipPotentialBand } {
  const score = round(
    0.35 * performance +
      0.2 * p.conscientiousness +
      0.15 * p.extraversion +
      0.15 * p.emotionalStability +
      0.15 * Math.min(100, years * 7),
  );
  const band: LeadershipPotentialBand = score >= 74 ? "high" : score >= 66 ? "ready" : score >= 56 ? "developing" : "emerging";
  return { score, band };
}

export function pickCareerAspiration(rng: Rng, roleCode: RoleCode, band: LeadershipPotentialBand, p: PersonalityProfile): string {
  const options: Array<[string, number]> = (() => {
    switch (roleCode) {
      case "branch_leader":
        return [["area_supervisor", band === "high" ? 4 : 2], ["operations_management", 1], ["training_role", p.agreeableness > 65 ? 2 : 0.5], ["stable_role", 1.5], ["quality_role", p.conscientiousness > 70 ? 1.5 : 0.3], ["further_education", 0.6]];
      case "junior_pharmacist":
        return [["clinical_specialist", 2], ["branch_leader", 1.5], ["further_education", 2], ["category_management", 0.6]];
      case "department_head":
      case "department_specialist":
        return [["operations_management", 1], ["stable_role", 1.5], ["further_education", 1], ["executive_leadership", 0.6]];
      default:
        return [["branch_leader", band === "high" || band === "ready" ? 3.5 : 1.5], ["clinical_specialist", 2], ["stable_role", 1.5], ["training_role", p.agreeableness > 65 ? 1.5 : 0.4], ["quality_role", p.conscientiousness > 70 ? 1.2 : 0.3], ["category_management", p.extraversion > 60 ? 1 : 0.3], ["further_education", 1]];
    }
  })();
  return rng.weightedSample(options.map((o) => o[0]), options.map((o) => o[1]), 1)[0]!;
}

export function pickBehavior(rng: Rng, p: PersonalityProfile): BehavioralTraits {
  const motivatorOptions = ["recognition", "growth", "stability", "autonomy", "financial_reward", "team_belonging", "patient_impact", "mastery"];
  const mw = motivatorOptions.map((m) => {
    let w = 1;
    if (m === "recognition" && p.extraversion > 60) w += 2;
    if (m === "growth" && p.openness > 60) w += 2;
    if (m === "stability" && p.emotionalStability < 50) w += 2;
    if (m === "autonomy" && p.agreeableness < 50) w += 1.5;
    if (m === "team_belonging" && p.agreeableness > 62) w += 2;
    if (m === "patient_impact" && p.agreeableness > 55) w += 1;
    if (m === "mastery" && p.conscientiousness > 62) w += 2;
    return w;
  });
  const triggerOptions = ["understaffing", "unclear_priorities", "public_criticism", "stock_shortages", "difficult_customers", "last_minute_changes", "micromanagement", "target_pressure"];
  const tw = triggerOptions.map((t) => {
    let w = 1;
    if (t === "public_criticism" && p.emotionalStability < 50) w += 2;
    if (t === "micromanagement" && p.openness > 60) w += 1.5;
    if (t === "last_minute_changes" && p.conscientiousness > 65) w += 2;
    if (t === "difficult_customers" && p.agreeableness > 65) w += 1.5;
    if (t === "target_pressure" && p.emotionalStability < 55) w += 1.5;
    if (t === "unclear_priorities" && p.conscientiousness > 60) w += 1;
    return w;
  });
  return {
    motivators: rng.weightedSample(motivatorOptions, mw, rng.chance(0.5) ? 2 : 3),
    stressTriggers: rng.weightedSample(triggerOptions, tw, 2),
    conflictApproach: deriveConflictApproach(p),
    decisionStyle: deriveDecisionStyle(p),
  };
}

export function buildSummary(
  firstName: LocalizedText,
  gender: "male" | "female",
  years: number,
  strengths: string[],
  gaps: string[],
): LocalizedText {
  const s = strengths.map((c) => COMPETENCIES[c as CompetencyCode]);
  const g = COMPETENCIES[gaps[0] as CompetencyCode];
  const yearsEn = years < 1 ? "less than a year" : years === 1 ? "1 year" : `${years} years`;
  const yearsAr = years < 1 ? "أقل من سنة" : years === 1 ? "سنة واحدة" : years === 2 ? "سنتين" : years <= 10 ? `${years} سنوات` : `${years} سنة`;
  return {
    en: `${firstName.en} brings ${yearsEn} of pharmacy experience. Colleagues rely on their ${s[0]!.en.toLowerCase()} and ${s[1]!.en.toLowerCase()}; the current development focus is ${g.en.toLowerCase()}.`,
    ar:
      gender === "female"
        ? `تمتلك ${firstName.ar} خبرة ${yearsAr} في العمل الصيدلي. يعتمد عليها الزملاء في ${s[0]!.ar} و${s[1]!.ar}، ومحور التطوير الحالي هو ${g.ar}.`
        : `يمتلك ${firstName.ar} خبرة ${yearsAr} في العمل الصيدلي. يعتمد عليه الزملاء في ${s[0]!.ar} و${s[1]!.ar}، ومحور التطوير الحالي هو ${g.ar}.`,
  };
}

export function assembleProfile(args: {
  employeeId: string;
  summary: LocalizedText;
  strengths: string[];
  developmentAreas: string[];
  communicationStyle: string;
  leadershipStyle: string | null;
  performanceScore: number;
  careerAspiration: string;
  personality: PersonalityProfile;
  behavior: BehavioralTraits;
  skills: SkillRating[];
  years: number;
}): EmployeeProfile {
  const lp = leadershipPotential(args.personality, args.performanceScore, args.years);
  return {
    employeeId: args.employeeId,
    summary: args.summary,
    strengths: args.strengths,
    developmentAreas: args.developmentAreas,
    communicationStyle: args.communicationStyle,
    leadershipStyle: args.leadershipStyle,
    leadershipPotentialScore: lp.score,
    leadershipPotential: lp.band,
    performanceScore: args.performanceScore,
    careerAspiration: args.careerAspiration,
    personality: args.personality,
    behavior: args.behavior,
    skills: args.skills,
  };
}
