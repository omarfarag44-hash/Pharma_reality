import type { OrgDataset } from "@/domain/dataset";
import type { DataMode } from "@/lib/env";
import type { OrgRepository } from "./types";

/**
 * Repository over an in-memory OrgDataset. Used directly in demo mode and,
 * for Sprint 1, by the database sources after they load the organisation's rows
 * (the whole organisation is ~100 people and 15 branches, so one load per request is cheap).
 */
export class DatasetRepository implements OrgRepository {
  constructor(
    private readonly data: OrgDataset,
    readonly mode: DataMode,
  ) {}

  async getOrganization() {
    return this.data.organization;
  }
  async getSimulationSession() {
    return this.data.simulation;
  }
  async listRoles() {
    return this.data.roles;
  }
  async listRegions() {
    return this.data.regions;
  }
  async listDepartments() {
    return this.data.departments;
  }
  async getDepartmentByCode(code: string) {
    return this.data.departments.find((d) => d.code.toLowerCase() === code.toLowerCase()) ?? null;
  }
  async listBranches() {
    return [...this.data.branches].sort((a, b) => a.number - b.number);
  }
  async getBranchByCode(code: string) {
    return this.data.branches.find((b) => b.code.toLowerCase() === code.toLowerCase()) ?? null;
  }
  async listBranchMetrics(branchId?: string) {
    return this.data.branchMetrics
      .filter((m) => !branchId || m.branchId === branchId)
      .sort((a, b) => a.month.localeCompare(b.month));
  }
  async listRegionMetrics() {
    return [...this.data.regionMetrics].sort((a, b) => a.month.localeCompare(b.month));
  }
  async listEmployees() {
    return this.data.employees;
  }
  async getEmployee(id: string) {
    return this.data.employees.find((e) => e.id === id) ?? null;
  }
  async listProfiles() {
    return this.data.profiles;
  }
  async getProfile(employeeId: string) {
    return this.data.profiles.find((p) => p.employeeId === employeeId) ?? null;
  }
  async listReportingLines() {
    return this.data.reportingLines;
  }
  async listRelationships(employeeId?: string) {
    return this.data.relationships.filter((r) => !employeeId || r.sourceId === employeeId || r.targetId === employeeId);
  }
  async listPerformanceReviews(employeeId?: string) {
    return this.data.performanceReviews
      .filter((r) => !employeeId || r.employeeId === employeeId)
      .sort((a, b) => a.period.localeCompare(b.period));
  }
  async listAttendance(employeeId?: string) {
    return this.data.attendance
      .filter((a) => !employeeId || a.employeeId === employeeId)
      .sort((a, b) => a.month.localeCompare(b.month));
  }
  async listTrainings(employeeId?: string) {
    return this.data.trainings.filter((t) => !employeeId || t.employeeId === employeeId);
  }
}
