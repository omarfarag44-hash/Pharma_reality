import { describe, expect, it } from "vitest";
import { DatasetRepository } from "@/data/repository/dataset-repository";
import { generateDataset } from "@/data/seed/generator";
import { filterBranches, filterEmployees, normaliseSearch } from "@/lib/directory/filters";
import { getBranchSummaries } from "@/services/branch-service";
import { listBranchEmployees } from "@/services/people-service";
import { BranchFiltersSchema, EmployeeFiltersSchema } from "@/validation/filters";

const repo = new DatasetRepository(generateDataset(), "demo");

describe("filter validation", () => {
  it("falls back to defaults for invalid params", () => {
    expect(BranchFiltersSchema.parse({ group: "Z", sort: "nope", dir: ["asc", "desc"] })).toEqual({ q: undefined, group: "all", status: "all", sort: "performance", dir: "asc" });
    expect(EmployeeFiltersSchema.parse({ branch: "DROP TABLE", role: "ceo" }).branch).toBe("all");
    expect(EmployeeFiltersSchema.parse({ role: "ceo" }).role).toBe("all");
  });
});

describe("search normalisation", () => {
  it("ignores case, hyphens and Arabic letter variants", () => {
    expect(normaliseSearch("Al-Olaya")).toBe("al olaya");
    expect(normaliseSearch("أحمد")).toBe(normaliseSearch("احمد"));
    expect(normaliseSearch("فاطمة")).toBe(normaliseSearch("فاطمه"));
  });
});

describe("branch directory", async () => {
  const all = await getBranchSummaries(repo);
  const f = (o: Record<string, string>) => filterBranches(all, BranchFiltersSchema.parse(o));
  it("lists all 15 branches by default, sorted by performance", () => {
    const rows = f({});
    expect(rows).toHaveLength(15);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1]!.performanceIndex).toBeGreaterThanOrEqual(rows[i]!.performanceIndex);
  });
  it("filters by group and search (EN, AR, code)", () => {
    expect(f({ group: "C" }).every((b) => b.branch.performanceGroup === "C")).toBe(true);
    expect(f({ group: "C" })).toHaveLength(5);
    expect(f({ q: "olaya" }).map((b) => b.code)).toEqual(["NX-C01"]);
    expect(f({ q: "العليا" }).map((b) => b.code)).toEqual(["NX-C01"]);
    expect(f({ q: "nx-c14" }).map((b) => b.code)).toEqual(["NX-C14"]);
  });
  it("filters by performance status", () => {
    expect(f({ status: "on_target" }).every((b) => b.current.achievement >= 100)).toBe(true);
    expect(f({ status: "below_target" }).every((b) => b.current.achievement < 100)).toBe(true);
    expect(f({ status: "on_target" }).length + f({ status: "below_target" }).length).toBe(15);
    expect(f({ status: "attention" }).every((b) => b.needsAttention)).toBe(true);
  });
  it("sorts by sales and operational indicators", () => {
    const bySales = f({ sort: "sales" });
    expect(bySales[0]!.current.salesActual).toBe(Math.max(...all.map((b) => b.current.salesActual)));
    const byCompliance = f({ sort: "compliance", dir: "asc" });
    expect(byCompliance[0]!.current.complianceScore).toBe(Math.min(...all.map((b) => b.current.complianceScore)));
  });
});

describe("employee directory", async () => {
  const all = await listBranchEmployees(repo);
  const f = (o: Record<string, string>) => filterEmployees(all, EmployeeFiltersSchema.parse(o), "en");
  it("contains exactly the 60 branch pharmacists", () => {
    expect(all).toHaveLength(60);
    expect(f({ role: "branch_leader" })).toHaveLength(15);
  });
  it("searches by name and by employee ID", () => {
    const someone = all[17]!;
    expect(f({ q: someone.employee.fullName.en.split(" ")[0]! }).some((r) => r.employee.id === someone.employee.id)).toBe(true);
    expect(f({ q: someone.employee.fullName.ar }).map((r) => r.employee.id)).toContain(someone.employee.id);
    expect(f({ q: someone.employee.employeeCode }).map((r) => r.employee.id)).toEqual([someone.employee.id]);
  });
  it("filters by branch, experience and performance", () => {
    expect(f({ branch: "NX-C05" })).toHaveLength(4);
    expect(f({ experience: "0-2" }).every((r) => r.employee.yearsOfExperience <= 2)).toBe(true);
    expect(f({ performance: "exceptional" }).every((r) => r.profile.performanceScore >= 90)).toBe(true);
    const sum = ["exceptional", "strong", "solid", "developing", "below"].reduce((s, p) => s + f({ performance: p }).length, 0);
    expect(sum).toBe(60);
  });
  it("sorts by performance", () => {
    const rows = f({ sort: "performance" });
    expect(rows[0]!.profile.performanceScore).toBe(Math.max(...all.map((r) => r.profile.performanceScore)));
  });
});
