/**
 * Renders the deterministic dataset as an idempotent SQL seed script.
 */
import type { OrgDataset } from "@/domain/dataset";
import { TABLE_ORDER, toRows, type TableName } from "@/data/sources/rows";
import { SEED_VERSION } from "./random";

const ARRAY_COLUMNS = new Set(["strengths", "development_areas"]);
const JSON_COLUMNS = new Set(["cities", "responsibilities", "behavioral_traits"]);

function quote(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function literal(column: string, value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (ARRAY_COLUMNS.has(column)) {
    const items = value as string[];
    return items.length === 0 ? "'{}'::text[]" : `array[${items.map(quote).join(",")}]::text[]`;
  }
  if (JSON_COLUMNS.has(column)) return `${quote(JSON.stringify(value))}::jsonb`;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Non-finite number in ${column}`);
    return String(value);
  }
  return quote(String(value));
}

function insert(table: TableName, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]!);
  const values = rows.map((r) => `  (${columns.map((c) => literal(c, r[c])).join(", ")})`).join(",\n");
  return `insert into public.${table} (${columns.join(", ")}) values\n${values};\n`;
}

export function datasetToSql(dataset: OrgDataset): string {
  const rows = toRows(dataset);
  const orgId = dataset.organization.id;
  const parts: string[] = [
    "-- =============================================================================",
    "-- PHARMA REALITY — deterministic seed data for NEXUS PHARMACIES (fictional)",
    `-- Seed version: ${SEED_VERSION}`,
    "-- GENERATED FILE. Do not edit by hand: run `npm run db:seed:generate`.",
    "-- All people, branches and figures are synthetic.",
    "-- =============================================================================",
    "",
    "begin;",
    "set constraints all deferred;",
    "",
    "-- Idempotent: remove the previous copy of this organisation (cascades to all child rows).",
    `delete from public.organizations where id = ${quote(orgId)};`,
    "",
  ];
  TABLE_ORDER.forEach((table) => {
    parts.push(`-- ${table} (${rows[table].length})`);
    parts.push(insert(table, rows[table]));
  });
  parts.push(`select public.generate_simulation_days(${quote(dataset.simulation.id)});`);
  parts.push(
    `insert into public.audit_logs (organization_id, action, entity_table, entity_id, after_data) values (${quote(orgId)}, 'seed.applied', 'organizations', ${quote(orgId)}, ${quote(JSON.stringify({ seedVersion: SEED_VERSION }))}::jsonb);`,
  );
  parts.push("", "commit;", "");
  return parts.join("\n");
}
