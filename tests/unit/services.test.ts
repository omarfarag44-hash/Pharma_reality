import { describe, expect, it } from "vitest";
import { DatasetRepository } from "@/data/repository/dataset-repository";
import { generateDataset } from "@/data/seed/generator";
import { achievementPct } from "@/lib/analytics";
import { getBranchDetail } from "@/services/branch-service";
import { getDashboard } from "@/services/dashboard-service";
import { getOrgChart, getPeerSupervisors, getRegionalPerformance } from "@/services/org-service";
import { getPersonDetail } from "@/services/people-service";

const data = generateDataset();
const repo = new DatasetRepository(data, "demo");

describe("dashboard", () => {
  it("calculates every headline number from records", async () => {
    const d = await getDashboard(repo);
    expect(d.counts).toMatchObject({ branches: 15, pharmacists: 60, branchLeaders: 15, departments: 8, peerSupervisors: 3, executives: 2 });
    const current = data.branchMetrics.filter((m) => m.provenance === "simulated_current");
    const target = current.reduce((s, m) => s + m.salesTarget, 0);
    const actual = current.reduce((s, m) => s + m.salesActual, 0);
    expect(d.area.salesActual).toBe(actual);
    expect(d.area.achievement).toBeCloseTo(achievementPct(actual, target), 10);
    expect(d.byGroup.map((g) => g.metrics.count)).toEqual([5, 5, 5]);
    expect(d.attention.length).toBeGreaterThan(0);
    expect(d.attention.length).toBeLessThan(15);
  });
});

describe("regions", () => {
  it("computes the player region from branches and ranks all four", async () => {
    const regions = await getRegionalPerformance(repo);
    expect(regions).toHaveLength(4);
    expect(regions.find((r) => r.isPlayerRegion)!.source).toBe("calculated");
    expect(new Set(regions.map((r) => r.rank))).toEqual(new Set([1, 2, 3, 4]));
  });
  it("returns three peers with performance and relationship", async () => {
    const peers = await getPeerSupervisors(repo);
    expect(peers).toHaveLength(3);
    peers.forEach((p) => {
      expect(p.relationship).not.toBeNull();
      expect(p.performance.achievement).toBeGreaterThan(0);
    });
  });
});

describe("org chart", () => {
  it("contains the full hierarchy", async () => {
    const c = await getOrgChart(repo);
    expect(c.branches).toHaveLength(15);
    expect(c.branches.every((b) => b.leader && b.members.length === 3)).toBe(true);
    expect(c.departments).toHaveLength(8);
    expect(c.peers).toHaveLength(3);
    expect(c.player.isPlayer).toBe(true);
  });
});

describe("details", () => {
  it("builds a branch detail with staff, strengths and distribution", async () => {
    const b = await getBranchDetail(repo, "nx-c01");
    expect(b).not.toBeNull();
    expect(b!.staff).toHaveLength(4);
    expect(b!.distribution.byRole.reduce((s, r) => s + r.count, 0)).toBe(4);
    expect(b!.summary.history.length).toBe(7);
    expect(await getBranchDetail(repo, "NX-C99")).toBeNull();
  });
  it("builds a person detail with reporting lines and history", async () => {
    const leader = data.employees.find((e) => e.isBranchLeader)!;
    const p = await getPersonDetail(repo, leader.id);
    expect(p!.managers[0]!.employee.isPlayer).toBe(true);
    expect(p!.directReports).toHaveLength(3);
    expect(p!.reviews).toHaveLength(4);
    expect(p!.attendanceSummary!.rate).toBeGreaterThan(80);
    expect(await getPersonDetail(repo, "00000000-0000-0000-0000-000000000000")).toBeNull();
  });
});
