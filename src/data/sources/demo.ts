import type { OrgDataset } from "@/domain/dataset";
import { generateDataset } from "@/data/seed/generator";

let cached: OrgDataset | null = null;

/** Deterministic demo dataset, generated once per server process. */
export function loadDemoDataset(): OrgDataset {
  cached ??= generateDataset();
  return cached;
}
