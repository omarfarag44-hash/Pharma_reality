import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { checkIntegrity } from "@/validation/dataset";
import { generateDataset } from "@/data/seed/generator";

export const dynamic = "force-dynamic";

/** Health check: reports the data mode and basic organisational counts (no personal data). */
export async function GET() {
  try {
    const repo = await getRepository();
    const [branches, employees, departments] = await Promise.all([repo.listBranches(), repo.listEmployees(), repo.listDepartments()]);
    const pharmacists = employees.filter((e) => e.branchId);
    const integrity = repo.mode === "demo" ? checkIntegrity(generateDataset()) : null;
    return NextResponse.json({
      status: "ok",
      mode: repo.mode,
      counts: {
        branches: branches.length,
        pharmacists: pharmacists.length,
        branchLeaders: pharmacists.filter((e) => e.isBranchLeader).length,
        departments: departments.length,
        peerSupervisors: employees.filter((e) => e.roleCode === "area_supervisor" && !e.isPlayer).length,
      },
      integrity: integrity ? { ok: integrity.ok, errors: integrity.errors.length } : undefined,
    });
  } catch (err) {
    return NextResponse.json({ status: "error", message: err instanceof Error ? err.message : "unknown" }, { status: 503 });
  }
}
