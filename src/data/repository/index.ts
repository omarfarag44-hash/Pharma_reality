import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { OrgDataset } from "@/domain/dataset";
import { resolveEnv, type DataMode } from "@/lib/env";
import { loadDemoDataset } from "@/data/sources/demo";
import { buildWorld, runSimulation, type SimulationRun, type World } from "@/lib/simulation/engine";
import { applySimulation } from "@/lib/simulation/overlay";
import { decodeProgress, EMPTY_PROGRESS, PROGRESS_COOKIE, type Progress } from "@/lib/simulation/progress";
import { DatasetRepository } from "./dataset-repository";
import type { OrgRepository } from "./types";

export type { OrgRepository } from "./types";

/**
 * Loads the organisation as seeded (before any simulation day is played).
 * - demo:     deterministic in-memory seed (no credentials needed)
 * - supabase: user-scoped PostgREST reads under Row Level Security
 * - postgres: server-only direct connection (DATABASE_URL)
 */
const loadBaseDataset = cache(async (): Promise<{ dataset: OrgDataset; mode: DataMode }> => {
  const env = resolveEnv();
  switch (env.mode) {
    case "supabase": {
      const [{ createSupabaseServerClient }, { loadSupabaseDataset }] = await Promise.all([
        import("@/lib/supabase/server"),
        import("@/data/sources/supabase"),
      ]);
      const client = await createSupabaseServerClient();
      return { dataset: await loadSupabaseDataset(client), mode: "supabase" };
    }
    case "postgres": {
      const { loadPostgresDataset } = await import("@/data/sources/postgres");
      return { dataset: await loadPostgresDataset(env.databaseUrl!), mode: "postgres" };
    }
    default:
      return { dataset: loadDemoDataset(), mode: "demo" };
  }
});

/** The player's saved progress (a small cookie). Missing or malformed progress means Day 1. */
export const readProgress = cache(async (): Promise<Progress> => {
  try {
    return decodeProgress((await cookies()).get(PROGRESS_COOKIE)?.value);
  } catch {
    return EMPTY_PROGRESS;
  }
});

const worlds = new WeakMap<OrgDataset, World>();

/** Replays the player's progress through the deterministic engine, once per request. */
export const getSimulation = cache(async (): Promise<SimulationRun & { progress: Progress }> => {
  const [{ dataset }, progress] = await Promise.all([loadBaseDataset(), readProgress()]);
  let world = worlds.get(dataset);
  if (!world) {
    world = buildWorld(dataset);
    worlds.set(dataset, world);
  }
  return { ...runSimulation(world, progress), progress };
});

/** Returns the repository for the current request: the seeded organisation as the player's decisions have changed it. */
export const getRepository = cache(async (): Promise<OrgRepository> => {
  const [{ dataset, mode }, run] = await Promise.all([loadBaseDataset(), getSimulation()]);
  return new DatasetRepository(applySimulation(dataset, run), mode);
});
