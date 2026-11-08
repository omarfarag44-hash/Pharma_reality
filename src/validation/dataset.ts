/**
 * Runtime validation of an OrgDataset, whichever source it came from.
 * Schema checks (Zod) + organisational integrity rules.
 */
import { z } from "zod";
import { DATA_PROVENANCE } from "@/domain/common";
import { ROLE_CODES } from "@/domain/organization";
import type { OrgDataset } from "@/domain/dataset";

const Localized = z.object({ en: z.string().min(1), ar: z.string().min(1) });
const Pct = z.number().min(0).max(100);
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const EmployeeSchema = z.object({
  id: z.uuid(),
  employeeCode: z.string().regex(/^NX-\d{5}$/),
  fullName: Localized,
  gender: z.enum(["male", "female"]),
  roleCode: z.enum(ROLE_CODES),
  jobTitle: Localized,
  branchId: z.uuid().nullable(),
  departmentId: z.uuid().nullable(),
  regionId: z.uuid().nullable(),
  isBranchLeader: z.boolean(),
  isPlayer: z.boolean(),
  yearsOfExperience: z.number().int().min(0).max(60),
  hireDate: IsoDate,
  employmentStatus: z.enum(["active", "probation", "on_leave"]),
  email: z.email(),
  phoneExtension: z.string(),
});

export const BranchSchema = z.object({
  id: z.uuid(),
  code: z.string().regex(/^NX-C\d{2}$/),
  number: z.number().int().min(1),
  name: Localized,
  regionId: z.uuid(),
  city: Localized,
  district: Localized,
  zone: z.enum(["riyadh_north", "riyadh_central_west", "riyadh_south_kharj"]),
  performanceGroup: z.enum(["A", "B", "C"]),
  category: z.enum(["flagship", "mall", "community", "medical", "highway"]),
  openedYear: z.number().int(),
  areaSqm: z.number().positive(),
  is24Hours: z.boolean(),
  context: Localized,
});

export const BranchMetricSchema = z.object({
  id: z.uuid(),
  branchId: z.uuid(),
  month: z.string().regex(/^\d{4}-\d{2}-01$/),
  salesTarget: z.number().positive(),
  salesActual: z.number().nonnegative(),
  transactions: z.number().int().positive(),
  stockAvailability: Pct,
  inventoryValue: z.number().nonnegative(),
  slowMovingValue: z.number().nonnegative(),
  nearExpiryValue: z.number().nonnegative(),
  complianceScore: Pct,
  customerSatisfaction: Pct,
  provenance: z.enum(DATA_PROVENANCE),
});

export const ProfileSchema = z.object({
  employeeId: z.uuid(),
  strengths: z.array(z.string()).min(1),
  developmentAreas: z.array(z.string()).min(1),
  performanceScore: Pct,
  leadershipPotentialScore: Pct,
  personality: z.object({ openness: Pct, conscientiousness: Pct, extraversion: Pct, agreeableness: Pct, emotionalStability: Pct }),
});

export interface IntegrityReport {
  ok: boolean;
  errors: string[];
}

/** Organisational rules from the Sprint 1 specification. */
export function checkIntegrity(d: OrgDataset): IntegrityReport {
  const errors: string[] = [];
  const push = (cond: boolean, msg: string) => {
    if (!cond) errors.push(msg);
  };

  const schemaCheck = <T>(schema: z.ZodType<T>, items: unknown[], label: string) => {
    items.forEach((item, i) => {
      const r = schema.safeParse(item);
      if (!r.success) errors.push(`${label}[${i}]: ${r.error.issues[0]?.path.join(".")} ${r.error.issues[0]?.message}`);
    });
  };
  schemaCheck(EmployeeSchema, d.employees, "employee");
  schemaCheck(BranchSchema, d.branches, "branch");
  schemaCheck(BranchMetricSchema, d.branchMetrics, "branchMetric");
  schemaCheck(ProfileSchema, d.profiles, "profile");

  const pharmacists = d.employees.filter((e) => e.branchId);
  push(d.branches.length === 15, `expected 15 branches, found ${d.branches.length}`);
  push(pharmacists.length === 60, `expected 60 branch employees, found ${pharmacists.length}`);
  push(pharmacists.filter((e) => e.isBranchLeader).length === 15, "expected 15 branch leaders");
  push(d.departments.length === 8, `expected 8 departments, found ${d.departments.length}`);
  push(d.employees.filter((e) => e.roleCode === "area_supervisor" && !e.isPlayer).length === 3, "expected 3 peer area supervisors");
  push(d.employees.filter((e) => e.isPlayer).length === 1, "expected exactly one player");
  push(d.employees.filter((e) => e.roleCode === "ceo").length === 1, "expected one CEO");
  push(d.employees.filter((e) => e.roleCode === "operations_director").length === 1, "expected one Operations Director");

  const employeeIds = new Set(d.employees.map((e) => e.id));
  const branchIds = new Set(d.branches.map((b) => b.id));
  d.branches.forEach((b) => {
    const staff = pharmacists.filter((e) => e.branchId === b.id);
    push(staff.length === 4, `${b.code}: expected 4 employees, found ${staff.length}`);
    push(staff.filter((e) => e.isBranchLeader).length === 1, `${b.code}: expected exactly 1 branch leader`);
    const months = d.branchMetrics.filter((m) => m.branchId === b.id);
    push(months.filter((m) => m.provenance === "synthetic_historical").length >= 3, `${b.code}: expected ≥3 historical snapshots`);
    push(months.filter((m) => m.provenance === "simulated_current").length === 1, `${b.code}: expected 1 current metric record`);
  });
  pharmacists.forEach((e) => push(branchIds.has(e.branchId!), `${e.employeeCode}: unknown branch`));
  push(new Set(d.employees.map((e) => e.employeeCode)).size === d.employees.length, "employee codes must be unique");
  push(new Set(d.employees.map((e) => e.fullName.en)).size === d.employees.length, "employee names must be unique");
  push(new Set(d.branches.map((b) => b.code)).size === d.branches.length, "branch codes must be unique");
  // The player's profile is intentionally empty: it will be built from their decisions (Leadership DNA, Sprint 2+).
  const npcs = d.employees.filter((e) => !e.isPlayer);
  push(d.profiles.length === npcs.length && npcs.every((e) => d.profiles.some((p) => p.employeeId === e.id)), "every non-player employee needs exactly one profile");
  d.reportingLines.forEach((l) => push(employeeIds.has(l.employeeId) && employeeIds.has(l.managerId), `reporting line ${l.id} references unknown people`));
  d.relationships.forEach((r) => push(employeeIds.has(r.sourceId) && employeeIds.has(r.targetId), `relationship ${r.id} references unknown people`));
  d.departments.forEach((dep) => push(employeeIds.has(dep.headId), `${dep.code}: head missing`));
  // Every non-CEO person has exactly one solid-line manager.
  d.employees
    .filter((e) => e.roleCode !== "ceo")
    .forEach((e) => push(d.reportingLines.filter((l) => l.employeeId === e.id && l.lineType === "solid").length === 1, `${e.employeeCode}: expected one solid-line manager`));
  return { ok: errors.length === 0, errors };
}
