import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateDataset } from "@/data/seed/generator";
import { datasetToSql } from "@/data/seed/sql";
import { fromRows, normaliseDataset, toRows } from "@/data/sources/rows";

describe("database row mapping", () => {
  const d = generateDataset();
  it("round-trips the dataset through table rows without loss", () => {
    expect(normaliseDataset(fromRows(toRows(d)))).toEqual(normaliseDataset(d));
  });
  it("splits current metrics and historical snapshots into separate tables", () => {
    const rows = toRows(d);
    expect(rows.branch_metrics).toHaveLength(15);
    expect(rows.metric_snapshots.filter((r) => r.scope === "branch")).toHaveLength(15 * 6);
    expect(rows.metric_snapshots.filter((r) => r.scope === "region")).toHaveLength(3 * 7);
  });
  it("keeps supabase/seed.sql in sync with the generator", () => {
    const file = readFileSync(resolve(__dirname, "../../supabase/seed.sql"), "utf8");
    expect(file).toBe(datasetToSql(d));
  });
});
