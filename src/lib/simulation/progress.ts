/**
 * The player's saved progress: the only mutable input of the simulation.
 *
 * Everything else (metrics, trust, memories, Leadership DNA) is recomputed from
 * it by the deterministic engine, so the progress is small enough for a cookie:
 *
 *   1|<day>|<day>.<code>.<option>~...|<day>.<branchCode>.<focus>~...
 *
 * (Only cookie-safe characters: no commas, spaces or semicolons.)
 *
 * Anything malformed is dropped rather than trusted. The engine also re-checks
 * every decision against the scenarios it actually generated for that day.
 */
import { COACHING_FOCUS, type CoachingFocus } from "./types";

export interface Progress {
  day: number;
  decisions: Array<{ day: number; code: number; option: number }>;
  coaching: Array<{ day: number; branchCode: string; focus: CoachingFocus }>;
}

export const PROGRESS_COOKIE = "PR_SIM";
const VERSION = "1";
const MAX_DAY = 91;

export const EMPTY_PROGRESS: Progress = { day: 1, decisions: [], coaching: [] };

export function encodeProgress(p: Progress): string {
  const d = p.decisions.map((x) => `${x.day}.${x.code}.${x.option}`).join("~");
  const c = p.coaching.map((x) => `${x.day}.${x.branchCode}.${x.focus}`).join("~");
  return [VERSION, String(p.day), d, c].join("|");
}

const int = (s: string | undefined) => (s !== undefined && /^\d{1,4}$/.test(s) ? Number(s) : null);

export function decodeProgress(raw: string | undefined | null): Progress {
  if (!raw || raw.length > 4000) return EMPTY_PROGRESS;
  const [version, dayRaw, dRaw = "", cRaw = ""] = raw.split("|");
  const day = int(dayRaw);
  if (version !== VERSION || day === null || day < 1 || day > MAX_DAY) return EMPTY_PROGRESS;

  const decisions: Progress["decisions"] = [];
  for (const item of dRaw ? dRaw.split("~") : []) {
    const [a, b, c] = item.split(".");
    const dd = int(a);
    const code = int(b);
    const option = int(c);
    if (dd === null || code === null || option === null || dd < 1 || dd > day) continue;
    decisions.push({ day: dd, code, option });
  }

  const coaching: Progress["coaching"] = [];
  for (const item of cRaw ? cRaw.split("~") : []) {
    const [a, code, focus] = item.split(".");
    const dd = int(a);
    if (dd === null || dd < 1 || dd > day || !code || !/^[A-Za-z0-9-]{1,12}$/.test(code)) continue;
    if (!(COACHING_FOCUS as readonly string[]).includes(focus ?? "")) continue;
    coaching.push({ day: dd, branchCode: code, focus: focus as CoachingFocus });
  }
  return { day, decisions, coaching };
}
