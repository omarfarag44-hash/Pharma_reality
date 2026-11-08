/**
 * Integration test against a real PostgreSQL server with the actual migrations,
 * RLS policies and seed applied (see scripts/db/local-postgres.sh).
 * Skipped unless TEST_DATABASE_URL is set.
 */
import { Client } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { generateDataset } from "@/data/seed/generator";
import { closePostgresPools, loadDatasetFromPostgres } from "@/data/sources/postgres-loader";
import { normaliseDataset } from "@/data/sources/rows";
import { checkIntegrity } from "@/validation/dataset";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("PostgreSQL persistence (migrations + seed)", () => {
  afterAll(async () => closePostgresPools());

  it("loads exactly the deterministic dataset back from the database", async () => {
    const fromDb = await loadDatasetFromPostgres(url!);
    expect(checkIntegrity(fromDb).errors).toEqual([]);
    expect(normaliseDataset(fromDb)).toEqual(normaliseDataset(generateDataset()));
  });

  it("enforces constraints: one leader per branch, no self-reporting", async () => {
    const c = new Client({ connectionString: url });
    await c.connect();
    try {
      const { rows } = await c.query("select id, branch_id from employees where is_branch_leader = false and branch_id is not null limit 1");
      await expect(c.query("update employees set is_branch_leader = true where id = $1", [rows[0].id])).rejects.toThrow(/employees_one_leader_per_branch/);
      const leader = await c.query("select id from employees where is_branch_leader limit 1");
      await expect(c.query("insert into reporting_lines (organization_id, employee_id, manager_id, line_type) select organization_id, id, id, 'dotted' from employees where id = $1", [leader.rows[0].id])).rejects.toThrow(/no_self_reporting/);
    } finally {
      await c.end();
    }
  });

  it("persists updates and records them in audit_logs", async () => {
    const c = new Client({ connectionString: url });
    await c.connect();
    try {
      await c.query("begin");
      const before = await c.query("select count(*)::int as n from audit_logs");
      await c.query("update branches set context_en = context_en || ' (test)' where code = 'NX-C01'");
      const after = await c.query("select count(*)::int as n from audit_logs where entity_table = 'branches' and action = 'update'");
      const v = await c.query("select context_en from branches where code = 'NX-C01'");
      expect(v.rows[0].context_en).toMatch(/\(test\)$/);
      expect(after.rows[0].n).toBeGreaterThanOrEqual(1);
      expect(before.rows[0].n).toBeGreaterThanOrEqual(1);
      await c.query("rollback");
    } finally {
      await c.end();
    }
  });

  it("applies row level security: no rows without a linked auth user, full org with one", async () => {
    const c = new Client({ connectionString: url });
    await c.connect();
    try {
      await c.query("begin");
      const authId = "11111111-1111-4111-8111-111111111111";
      await c.query("insert into auth.users (id, email) values ($1, 'rls-test@example.com')", [authId]);
      await c.query("select public.link_auth_user('rls-test@example.com')");

      await c.query("set local role authenticated");
      await c.query("select set_config('request.jwt.claim.sub', '', true)");
      const anonymous = await c.query("select count(*)::int as n from branches");
      expect(anonymous.rows[0].n).toBe(0);

      await c.query("select set_config('request.jwt.claim.sub', $1, true)", [authId]);
      const linked = await c.query("select (select count(*) from branches)::int as b, (select count(*) from employees where branch_id is not null)::int as e");
      expect(linked.rows[0]).toEqual({ b: 15, e: 60 });
      await expect(c.query("update branches set name_en = 'x'")).resolves.toMatchObject({ rowCount: 0 });
      await c.query("rollback");
    } finally {
      await c.end();
    }
  });
});
