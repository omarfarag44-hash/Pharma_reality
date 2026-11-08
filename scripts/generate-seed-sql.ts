/**
 * Writes supabase/seed.sql from the deterministic generator.
 * Usage: npm run db:seed:generate
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateDataset } from "../src/data/seed/generator";
import { datasetToSql } from "../src/data/seed/sql";

const target = resolve(__dirname, "../supabase/seed.sql");
const sql = datasetToSql(generateDataset());
writeFileSync(target, sql, "utf8");
console.log(`Wrote ${target} (${(sql.length / 1024).toFixed(1)} KB)`);
