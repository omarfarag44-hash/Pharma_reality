/**
 * Deterministic pseudo-random utilities.
 * Every generator call is keyed by a string, so adding or reordering entities
 * never changes the values generated for unrelated entities.
 */

export const SEED_VERSION = "nexus-sprint1-v1";

/** cyrb128 string hash → four 32-bit integers. */
function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** Deterministic UUID (RFC 4122 layout, version nibble 5) derived from a key. */
export function stableUuid(key: string): string {
  const parts = cyrb128(`${SEED_VERSION}:${key}`).concat(cyrb128(`${key}:${SEED_VERSION}`));
  const hex = parts.map((n) => n.toString(16).padStart(8, "0")).join("").slice(0, 32);
  const chars = hex.split("");
  chars[12] = "5";
  chars[16] = ((parseInt(chars[16]!, 16) & 0x3) | 0x8).toString(16);
  const h = chars.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  float(min: number, max: number): number;
  int(min: number, max: number): number;
  /** Approximately normal value, clamped to [min, max]. */
  normal(mean: number, sd: number, min?: number, max?: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  /** Pick `count` distinct items, weighted. */
  weightedSample<T>(items: readonly T[], weights: readonly number[], count: number): T[];
  chance(probability: number): boolean;
}

/** sfc32 generator seeded from a string key. */
export function createRng(key: string): Rng {
  let [a, b, c, d] = cyrb128(`${SEED_VERSION}:${key}`);
  const next = (): number => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  // Warm up.
  for (let i = 0; i < 12; i++) next();

  const rng: Rng = {
    next,
    float: (min, max) => min + (max - min) * next(),
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    normal: (mean, sd, min = -Infinity, max = Infinity) => {
      const u = Math.max(next(), 1e-9);
      const v = next();
      const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return Math.min(max, Math.max(min, mean + z * sd));
    },
    pick: (items) => {
      if (items.length === 0) throw new Error("Cannot pick from an empty list");
      return items[Math.floor(next() * items.length)]!;
    },
    shuffle: (items) => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      }
      return copy;
    },
    weightedSample: (items, weights, count) => {
      const pool = items.map((item, i) => ({ item, w: Math.max(0, weights[i] ?? 0) }));
      const out: (typeof items)[number][] = [];
      while (out.length < count && pool.some((p) => p.w > 0)) {
        const total = pool.reduce((s, p) => s + p.w, 0);
        let r = next() * total;
        const idx = pool.findIndex((p) => (r -= p.w) < 0);
        const chosen = pool.splice(idx === -1 ? pool.length - 1 : idx, 1)[0]!;
        out.push(chosen.item);
      }
      return out;
    },
    chance: (p) => next() < p,
  };
  return rng;
}

export function round(value: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
