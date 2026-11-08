import "server-only";
import type { OrgDataset } from "@/domain/dataset";
import { loadDatasetFromPostgres } from "./postgres-loader";

/** Server-only PostgreSQL source (DATABASE_URL). Bypasses RLS; never exposed to the browser. */
export async function loadPostgresDataset(databaseUrl: string): Promise<OrgDataset> {
  return loadDatasetFromPostgres(databaseUrl);
}
