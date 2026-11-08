import { describe, expect, it } from "vitest";
import { generateDataset } from "@/data/seed/generator";
import { checkIntegrity } from "@/validation/dataset";
import { achievementPct, averageBasket } from "@/lib/analytics";
import { BRANCHES } from "@/data/seed/world";

const d = generateDataset();
const pharmacists = d.employees.filter((e) => e.branchId);

describe("organisational structure", () => {
  it("passes every integrity rule", () => {
    const report = checkIntegrity(d);
    expect(report.errors).toEqual([]);
    expect(report.ok).toBe(true);
  });
  it("has 15 branches, 60 pharmacists, 15 leaders, 8 departments, 3 peers", () => {
    expect(d.branches).toHaveLength(15);
    expect(pharmacists).toHaveLength(60);
    expect(pharmacists.filter((e) => e.isBranchLeader)).toHaveLength(15);
    expect(d.departments).toHaveLength(8);
    expect(d.employees.filter((e) => e.roleCode === "area_supervisor" && !e.isPlayer)).toHaveLength(3);
  });
  it("has separate CEO and Operations Director profiles and one player", () => {
    const ceo = d.employees.filter((e) => e.roleCode === "ceo");
    const od = d.employees.filter((e) => e.roleCode === "operations_director");
    expect(ceo).toHaveLength(1);
    expect(od).toHaveLength(1);
    expect(ceo[0]!.id).not.toBe(od[0]!.id);
    expect(d.employees.filter((e) => e.isPlayer)).toHaveLength(1);
  });
  it("follows CEO → Ops Director → Area Supervisor → Branch Leaders → Pharmacists", () => {
    const solid = (id: string) => d.reportingLines.find((l) => l.employeeId === id && l.lineType === "solid")?.managerId;
    const ceo = d.employees.find((e) => e.roleCode === "ceo")!;
    const od = d.employees.find((e) => e.roleCode === "operations_director")!;
    const player = d.employees.find((e) => e.isPlayer)!;
    expect(solid(od.id)).toBe(ceo.id);
    expect(solid(player.id)).toBe(od.id);
    d.branches.forEach((b) => {
      const staff = pharmacists.filter((e) => e.branchId === b.id);
      const leader = staff.find((e) => e.isBranchLeader)!;
      expect(solid(leader.id)).toBe(player.id);
      staff.filter((e) => !e.isBranchLeader).forEach((e) => expect(solid(e.id)).toBe(leader.id));
    });
  });
  it("gives every department a head, members, responsibilities, KPIs and contact", () => {
    d.departments.forEach((dep) => {
      expect(d.employees.some((e) => e.id === dep.headId)).toBe(true);
      expect(d.employees.filter((e) => e.departmentId === dep.id && e.roleCode === "department_specialist").length).toBeGreaterThanOrEqual(2);
      expect(dep.responsibilities.length).toBeGreaterThanOrEqual(3);
      expect(dep.kpis.length).toBeGreaterThanOrEqual(3);
      expect(dep.contact.email).toMatch(/@nexus-pharmacies\.example$/);
    });
    expect(d.departments.map((x) => x.code).sort()).toEqual(["FIN", "HR", "MKT", "OPS", "PUR", "QAC", "SCM", "TND"]);
  });
  it("gives each peer a distinct region, style and relationship with the player", () => {
    const player = d.employees.find((e) => e.isPlayer)!;
    const peers = d.employees.filter((e) => e.roleCode === "area_supervisor" && !e.isPlayer);
    expect(new Set(peers.map((p) => p.regionId)).size).toBe(3);
    const styles = peers.map((p) => d.profiles.find((x) => x.employeeId === p.id)!.leadershipStyle);
    expect(new Set(styles).size).toBe(3);
    peers.forEach((p) => expect(d.relationships.some((r) => r.sourceId === player.id && r.targetId === p.id)).toBe(true));
  });
});

describe("branch data", () => {
  it("uses the A/B/C groups for branches 01–05, 06–10, 11–15", () => {
    d.branches.forEach((b) => {
      const expected = b.number <= 5 ? "A" : b.number <= 10 ? "B" : "C";
      expect(b.performanceGroup).toBe(expected);
    });
  });
  it("has ≥3 historical snapshots plus one current record per branch", () => {
    d.branches.forEach((b) => {
      const m = d.branchMetrics.filter((x) => x.branchId === b.id);
      expect(m.filter((x) => x.provenance === "synthetic_historical").length).toBeGreaterThanOrEqual(3);
      expect(m.filter((x) => x.provenance === "simulated_current")).toHaveLength(1);
      expect(m.filter((x) => x.provenance === "scenario_generated")).toHaveLength(0);
    });
  });
  it("is internally consistent: sales ≈ customers × basket and value fractions within inventory", () => {
    d.branchMetrics.forEach((m) => {
      const basket = averageBasket(m.salesActual, m.transactions);
      expect(Math.abs(basket * m.transactions - m.salesActual)).toBeLessThan(1e-6);
      expect(m.slowMovingValue + m.nearExpiryValue).toBeLessThan(m.inventoryValue);
    });
  });
  it("produces varied metrics that separate the groups", () => {
    const current = d.branches.map((b) => {
      const m = d.branchMetrics.find((x) => x.branchId === b.id && x.provenance === "simulated_current")!;
      return { group: b.performanceGroup, ach: achievementPct(m.salesActual, m.salesTarget), m };
    });
    expect(new Set(current.map((c) => c.m.salesActual)).size).toBe(15);
    const avg = (g: string) => current.filter((c) => c.group === g).reduce((s, c) => s + c.ach, 0) / 5;
    expect(avg("A")).toBeGreaterThan(avg("B"));
    expect(avg("B")).toBeGreaterThan(avg("C"));
    expect(BRANCHES).toHaveLength(15);
  });
});

describe("employee data", () => {
  it("creates meaningfully different profiles", () => {
    const profiles = pharmacists.map((e) => d.profiles.find((p) => p.employeeId === e.id)!);
    const signatures = new Set(profiles.map((p) => `${p.communicationStyle}|${p.strengths.join(",")}|${p.developmentAreas.join(",")}`));
    expect(signatures.size).toBe(60);
    expect(new Set(profiles.map((p) => p.communicationStyle)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(pharmacists.map((e) => e.yearsOfExperience)).size).toBeGreaterThanOrEqual(10);
    profiles.forEach((p) => p.strengths.forEach((s) => expect(p.developmentAreas).not.toContain(s)));
  });
  it("gives every pharmacist reviews, attendance and training history", () => {
    pharmacists.forEach((e) => {
      expect(d.performanceReviews.filter((r) => r.employeeId === e.id)).toHaveLength(4);
      expect(d.attendance.some((a) => a.employeeId === e.id)).toBe(true);
      expect(d.trainings.some((t) => t.employeeId === e.id && t.courseCode === "TR-ONB")).toBe(true);
    });
  });
  it("leaders are more experienced than junior pharmacists", () => {
    const leaders = pharmacists.filter((e) => e.isBranchLeader);
    const juniors = pharmacists.filter((e) => e.roleCode === "junior_pharmacist");
    expect(Math.min(...leaders.map((e) => e.yearsOfExperience))).toBeGreaterThan(Math.max(...juniors.map((e) => e.yearsOfExperience)));
  });
});

describe("determinism", () => {
  it("regenerates exactly the same dataset", () => {
    expect(JSON.stringify(generateDataset())).toBe(JSON.stringify(d));
  });
});
