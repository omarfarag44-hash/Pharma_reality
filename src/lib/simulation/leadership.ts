/**
 * Leadership DNA: turns the points collected from decisions into 0–100 scores
 * and a dominant leadership style. Pure and deterministic.
 */
import { DNA_DIMENSIONS, type DnaDimension } from "./types";
import type { SimState } from "./engine";

/** Decisions needed before the profile is shown as a style rather than "still forming". */
export const DNA_MIN_DECISIONS = 3;

/** Leadership style suggested by the strongest dimension. */
export const DNA_STYLE: Record<DnaDimension, string> = {
  results: "pacesetting",
  people: "coaching",
  integrity: "principled",
  customer: "service",
  collaboration: "affiliative",
  decisiveness: "directive",
};

/**
 * 50 is neutral. Points move the score along a tanh curve so that it never leaves 0–100.
 * The scale grows with the number of decisions, so a long game measures how consistently
 * a trait shows up rather than saturating at 100.
 */
export function dnaScore(points: number, decisions = 0): number {
  return Math.round(50 + 50 * Math.tanh(points / Math.max(6, decisions * 0.8)));
}

export interface LeadershipDna {
  scores: Record<DnaDimension, number>;
  decisions: number;
  ignored: number;
  ready: boolean;
  dominant: DnaDimension | null;
  weakest: DnaDimension | null;
  style: string | null;
}

export function leadershipDna(state: Pick<SimState, "dna" | "decisions">): LeadershipDna {
  const decisions = state.decisions.filter((d) => d.option !== null).length;
  const scores = Object.fromEntries(DNA_DIMENSIONS.map((d) => [d, dnaScore(state.dna[d], state.decisions.length)])) as Record<DnaDimension, number>;
  const ignored = state.decisions.length - decisions;
  const ready = decisions >= DNA_MIN_DECISIONS;
  const ranked = [...DNA_DIMENSIONS].sort((a, b) => state.dna[b] - state.dna[a] || DNA_DIMENSIONS.indexOf(a) - DNA_DIMENSIONS.indexOf(b));
  const dominant = ready && state.dna[ranked[0]!] > 0 ? ranked[0]! : null;
  const weakest = ready ? ranked[ranked.length - 1]! : null;
  return { scores, decisions, ignored, ready, dominant, weakest, style: dominant ? DNA_STYLE[dominant] : null };
}
