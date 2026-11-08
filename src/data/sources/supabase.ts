import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrgDataset } from "@/domain/dataset";
import { fromRows, TABLE_ORDER, type TableRows } from "./rows";

const PAGE_SIZE = 1000;

async function fetchAll(client: SupabaseClient, table: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select("*").range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Supabase query on ${table} failed: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return out;
}

/**
 * Loads the signed-in user's organisation through PostgREST with the user's
 * session (anon key + JWT). Row Level Security limits every table to that organisation.
 */
export async function loadSupabaseDataset(client: SupabaseClient): Promise<OrgDataset> {
  const entries = await Promise.all(TABLE_ORDER.map(async (t) => [t, await fetchAll(client, t)] as const));
  const rows = Object.fromEntries(entries) as TableRows;
  if (rows.organizations.length === 0) {
    throw new Error("No organisation is visible to this account. Link it with public.link_auth_user() (see README).");
  }
  return fromRows(rows);
}
