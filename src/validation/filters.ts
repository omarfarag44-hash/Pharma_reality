/**
 * URL search-param validation for directory screens.
 * Invalid or unknown values fall back to safe defaults instead of throwing.
 */
import { z } from "zod";
import { BRANCH_SORT_KEYS } from "@/lib/analytics/aggregation";

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
const text = z.preprocess(first, z.string().trim().max(80).optional().catch(undefined));

export const BranchFiltersSchema = z.object({
  q: text,
  group: z.preprocess(first, z.enum(["all", "A", "B", "C"]).default("all").catch("all")),
  status: z.preprocess(first, z.enum(["all", "on_target", "below_target", "attention"]).default("all").catch("all")),
  sort: z.preprocess(first, z.enum(BRANCH_SORT_KEYS).default("performance").catch("performance")),
  dir: z.preprocess(first, z.enum(["desc", "asc"]).default("desc").catch("desc")),
});
export type BranchFilters = z.infer<typeof BranchFiltersSchema>;

export const EmployeeFiltersSchema = z.object({
  q: text,
  branch: z.preprocess(first, z.string().regex(/^(all|NX-C\d{2})$/).default("all").catch("all")),
  role: z.preprocess(
    first,
    z.enum(["all", "branch_leader", "senior_pharmacist", "pharmacist", "junior_pharmacist"]).default("all").catch("all"),
  ),
  experience: z.preprocess(first, z.enum(["all", "0-2", "3-5", "6-10", "11+"]).default("all").catch("all")),
  performance: z.preprocess(
    first,
    z.enum(["all", "exceptional", "strong", "solid", "developing", "below"]).default("all").catch("all"),
  ),
  sort: z.preprocess(first, z.enum(["code", "name", "performance", "experience"]).default("code").catch("code")),
});
export type EmployeeFilters = z.infer<typeof EmployeeFiltersSchema>;

export const CalendarViewSchema = z.preprocess(first, z.enum(["day", "week", "month"]).default("week").catch("week"));
export type CalendarView = z.infer<typeof CalendarViewSchema>;
