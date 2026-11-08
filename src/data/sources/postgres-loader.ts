/**
 * Loads one organisation from PostgreSQL. Kept free of `server-only` so the
 * integration test can import it directly under Vitest.
 */
import { Pool, types } from "pg";
import type { OrgDataset } from "@/domain/dataset";
import { fromRows, TABLE_ORDER, type TableRows } from "./rows";

// Return DATE columns as plain YYYY-MM-DD strings instead of JS Dates.
types.setTypeParser(1082, (v: string) => v);

const pools = new Map<string, Pool>();

function poolFor(url: string): Pool {
  let pool = pools.get(url);
  if (!pool) {
    pool = new Pool({ connectionString: url, max: 4 });
    pools.set(url, pool);
  }
  return pool;
}

export async function loadDatasetFromPostgres(databaseUrl: string, organizationCode = "NEXUS"): Promise<OrgDataset> {
  const pool = poolFor(databaseUrl);
  const org = await pool.query("select id from public.organizations where code = $1", [organizationCode]);
  const orgId: string | undefined = org.rows[0]?.id;
  if (!orgId) throw new Error(`Organisation ${organizationCode} not found. Apply supabase/seed.sql first.`);
  const entries = await Promise.all(
    TABLE_ORDER.map(async (table) => {
      const where = table === "organizations" ? "id = $1" : "organization_id = $1";
      const res = await pool.query(`select * from public.${table} where ${where}`, [orgId]);
      return [table, res.rows] as const;
    }),
  );
  return fromRows(Object.fromEntries(entries) as TableRows);
}

export async function closePostgresPools(): Promise<void> {
  await Promise.all([...pools.values()].map((p) => p.end()));
  pools.clear();
}
