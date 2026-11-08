/**
 * Environment resolution. Missing variables never crash the app:
 * without credentials the app runs in DEMO MODE.
 */
import { z } from "zod";

export const DATA_MODES = ["demo", "supabase", "postgres"] as const;
export type DataMode = (typeof DATA_MODES)[number];

const EnvSchema = z.object({
  PHARMA_DATA_MODE: z.enum(["auto", ...DATA_MODES]).default("auto"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//).optional(),
});

export interface ResolvedEnv {
  mode: DataMode;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  databaseUrl?: string;
  /** Human-readable reason when the requested mode could not be used. */
  warning?: string;
}

const blankToUndefined = (v: string | undefined) => (v && v.trim() !== "" ? v.trim() : undefined);

export function resolveEnv(source: Record<string, string | undefined> = process.env): ResolvedEnv {
  const parsed = EnvSchema.safeParse({
    PHARMA_DATA_MODE: blankToUndefined(source.PHARMA_DATA_MODE),
    NEXT_PUBLIC_SUPABASE_URL: blankToUndefined(source.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: blankToUndefined(source.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    DATABASE_URL: blankToUndefined(source.DATABASE_URL),
  });
  if (!parsed.success) {
    return { mode: "demo", warning: `Invalid environment configuration (${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}); running in demo mode.` };
  }
  const env = parsed.data;
  const hasSupabase = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasPostgres = Boolean(env.DATABASE_URL);
  const base = { supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL, supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, databaseUrl: env.DATABASE_URL };

  switch (env.PHARMA_DATA_MODE) {
    case "demo":
      return { ...base, mode: "demo" };
    case "supabase":
      return hasSupabase ? { ...base, mode: "supabase" } : { ...base, mode: "demo", warning: "PHARMA_DATA_MODE=supabase but Supabase URL/anon key are missing; running in demo mode." };
    case "postgres":
      return hasPostgres ? { ...base, mode: "postgres" } : { ...base, mode: "demo", warning: "PHARMA_DATA_MODE=postgres but DATABASE_URL is missing; running in demo mode." };
    default:
      if (hasSupabase) return { ...base, mode: "supabase" };
      if (hasPostgres) return { ...base, mode: "postgres" };
      return { ...base, mode: "demo" };
  }
}
