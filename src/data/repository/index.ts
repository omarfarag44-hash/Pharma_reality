import "server-only";
import { cache } from "react";
import { resolveEnv } from "@/lib/env";
import { loadDemoDataset } from "@/data/sources/demo";
import { DatasetRepository } from "./dataset-repository";
import type { OrgRepository } from "./types";

export type { OrgRepository } from "./types";

/**
 * Returns the repository for the current request.
 * - demo:     deterministic in-memory seed (no credentials needed)
 * - supabase: user-scoped PostgREST reads under Row Level Security
 * - postgres: server-only direct connection (DATABASE_URL)
 */
export const getRepository = cache(async (): Promise<OrgRepository> => {
  const env = resolveEnv();
  switch (env.mode) {
    case "supabase": {
      const [{ createSupabaseServerClient }, { loadSupabaseDataset }] = await Promise.all([
        import("@/lib/supabase/server"),
        import("@/data/sources/supabase"),
      ]);
      const client = await createSupabaseServerClient();
      return new DatasetRepository(await loadSupabaseDataset(client), "supabase");
    }
    case "postgres": {
      const { loadPostgresDataset } = await import("@/data/sources/postgres");
      return new DatasetRepository(await loadPostgresDataset(env.databaseUrl!), "postgres");
    }
    default:
      return new DatasetRepository(loadDemoDataset(), "demo");
  }
});
