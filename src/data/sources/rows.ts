/**
 * Mapping between the domain dataset and relational table rows.
 *
 * toRows()   — used by the seed SQL generator.
 * fromRows() — used by the Supabase and PostgreSQL data sources.
 *
 * A unit test asserts fromRows(toRows(dataset)) deep-equals the dataset, so the
 * database round-trip cannot silently drop or distort fields.
 */
import type { BranchMetricRecord, RegionMetricRecord } from "@/domain/branch";
import type { LocalizedText, MonthKey } from "@/domain/common";
import type { OrgDataset } from "@/domain/dataset";
import type { RoleCode, SimulationStatus } from "@/domain/organization";
import type { BehavioralTraits, Relationship } from "@/domain/people";

type Row = Record<string, unknown>;

export const TABLE_ORDER = [
  "organizations",
  "roles",
  "regions",
  "departments",
  "department_kpis",
  "branches",
  "employees",
  "employee_profiles",
  "employee_skills",
  "performance_reviews",
  "attendance_records",
  "training_records",
  "reporting_lines",
  "relationships",
  "branch_metrics",
  "metric_snapshots",
  "users",
  "simulation_sessions",
] as const;
export type TableName = (typeof TABLE_ORDER)[number];
export type TableRows = Record<TableName, Row[]>;

const lt = (row: Row, prefix: string): LocalizedText => ({ en: String(row[`${prefix}_en`] ?? ""), ar: String(row[`${prefix}_ar`] ?? "") });
const num = (v: unknown): number => (typeof v === "number" ? v : Number(v));
const str = (v: unknown): string => String(v);
const nullableStr = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
/** Normalises date values from pg (Date) or PostgREST (string) to YYYY-MM-DD. */
export const isoDate = (v: unknown): string => {
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(v).slice(0, 10);
};
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
const json = <T>(v: unknown): T => (typeof v === "string" ? (JSON.parse(v) as T) : (v as T));

// ============================================================================ dataset → rows

export function toRows(d: OrgDataset): TableRows {
  const org = d.organization.id;
  const roleId = new Map(d.roles.map((r) => [r.code, r.id]));
  const metricCols = (m: BranchMetricRecord | RegionMetricRecord) => ({
    period_month: m.month,
    sales_target: m.salesTarget,
    sales_actual: m.salesActual,
    transactions: m.transactions,
    stock_availability: m.stockAvailability,
    compliance_score: m.complianceScore,
    customer_satisfaction: m.customerSatisfaction,
    provenance: m.provenance,
  });

  return {
    organizations: [
      {
        id: org,
        code: d.organization.code,
        name_en: d.organization.name.en,
        name_ar: d.organization.name.ar,
        tagline_en: d.organization.tagline.en,
        tagline_ar: d.organization.tagline.ar,
        headquarters_en: d.organization.headquarters.en,
        headquarters_ar: d.organization.headquarters.ar,
        founded_year: d.organization.foundedYear,
        is_fictional: true,
      },
    ],
    roles: d.roles.map((r) => ({ id: r.id, organization_id: org, code: r.code, title_en: r.title.en, title_ar: r.title.ar, level: r.level, workforce: r.workforce })),
    regions: d.regions.map((r) => ({
      id: r.id, organization_id: org, code: r.code, name_en: r.name.en, name_ar: r.name.ar,
      cities: r.cities, supervisor_id: r.supervisorId, is_player_region: r.isPlayerRegion, branch_count: r.branchCount,
    })),
    departments: d.departments.map((x) => ({
      id: x.id, organization_id: org, code: x.code, name_en: x.name.en, name_ar: x.name.ar,
      description_en: x.description.en, description_ar: x.description.ar, head_id: x.headId, reports_to_id: x.reportsToId,
      responsibilities: x.responsibilities, contact_email: x.contact.email, contact_extension: x.contact.phoneExtension,
      location_en: x.contact.location.en, location_ar: x.contact.location.ar,
    })),
    department_kpis: d.departments.flatMap((x) =>
      x.kpis.map((k) => ({
        id: k.id, organization_id: org, department_id: x.id, code: k.code, name_en: k.name.en, name_ar: k.name.ar,
        unit: k.unit, target_value: k.target, current_value: k.current, direction: k.direction,
      })),
    ),
    branches: d.branches.map((b) => ({
      id: b.id, organization_id: org, region_id: b.regionId, code: b.code, branch_number: b.number,
      name_en: b.name.en, name_ar: b.name.ar, city_en: b.city.en, city_ar: b.city.ar, district_en: b.district.en, district_ar: b.district.ar,
      zone: b.zone, performance_group: b.performanceGroup, category: b.category, opened_year: b.openedYear, area_sqm: b.areaSqm,
      is_24_hours: b.is24Hours, context_en: b.context.en, context_ar: b.context.ar,
    })),
    employees: d.employees.map((e) => ({
      id: e.id, organization_id: org, employee_code: e.employeeCode, full_name_en: e.fullName.en, full_name_ar: e.fullName.ar,
      gender: e.gender, role_id: roleId.get(e.roleCode), job_title_en: e.jobTitle.en, job_title_ar: e.jobTitle.ar,
      branch_id: e.branchId, department_id: e.departmentId, region_id: e.regionId, is_branch_leader: e.isBranchLeader,
      is_player: e.isPlayer, years_of_experience: e.yearsOfExperience, hire_date: e.hireDate, employment_status: e.employmentStatus,
      email: e.email, phone_extension: e.phoneExtension,
    })),
    employee_profiles: d.profiles.map((p) => ({
      employee_id: p.employeeId, organization_id: org, summary_en: p.summary.en, summary_ar: p.summary.ar,
      strengths: p.strengths, development_areas: p.developmentAreas, communication_style: p.communicationStyle,
      leadership_style: p.leadershipStyle, leadership_potential_score: p.leadershipPotentialScore, leadership_potential: p.leadershipPotential,
      performance_score: p.performanceScore, career_aspiration: p.careerAspiration,
      openness: p.personality.openness, conscientiousness: p.personality.conscientiousness, extraversion: p.personality.extraversion,
      agreeableness: p.personality.agreeableness, emotional_stability: p.personality.emotionalStability,
      behavioral_traits: p.behavior,
    })),
    employee_skills: d.profiles.flatMap((p) => p.skills.map((s) => ({ employee_id: p.employeeId, organization_id: org, skill_code: s.code, proficiency: s.level }))),
    performance_reviews: d.performanceReviews.map((r) => ({ id: r.id, organization_id: org, employee_id: r.employeeId, period: r.period, period_end: r.periodEnd, score: r.score, provenance: r.provenance })),
    attendance_records: d.attendance.map((a) => ({
      id: a.id, organization_id: org, employee_id: a.employeeId, period_month: a.month, scheduled_shifts: a.scheduledShifts,
      attended_shifts: a.attendedShifts, late_arrivals: a.lateArrivals, unplanned_absences: a.unplannedAbsences, provenance: a.provenance,
    })),
    training_records: d.trainings.map((t) => ({ id: t.id, organization_id: org, employee_id: t.employeeId, course_code: t.courseCode, status: t.status, completed_on: t.completedOn, hours: t.hours })),
    reporting_lines: d.reportingLines.map((l) => ({
      id: l.id, organization_id: org, employee_id: l.employeeId, manager_id: l.managerId, line_type: l.lineType,
      context_en: l.context?.en ?? null, context_ar: l.context?.ar ?? null,
    })),
    relationships: d.relationships.map((r) => ({
      id: r.id, organization_id: org, source_id: r.sourceId, target_id: r.targetId, relationship_type: r.type,
      trust: r.trust, rapport: r.rapport, description_en: r.description.en, description_ar: r.description.ar,
    })),
    branch_metrics: d.branchMetrics
      .filter((m) => m.provenance !== "synthetic_historical")
      .map((m) => ({
        id: m.id, organization_id: org, branch_id: m.branchId, ...metricCols(m),
        inventory_value: m.inventoryValue, slow_moving_value: m.slowMovingValue, near_expiry_value: m.nearExpiryValue, as_of_day: d.simulation.currentDay,
      })),
    metric_snapshots: [
      ...d.branchMetrics
        .filter((m) => m.provenance === "synthetic_historical")
        .map((m) => ({
          id: m.id, organization_id: org, scope: "branch", branch_id: m.branchId, region_id: null, ...metricCols(m),
          inventory_value: m.inventoryValue, slow_moving_value: m.slowMovingValue, near_expiry_value: m.nearExpiryValue,
        })),
      ...d.regionMetrics.map((m) => ({
        id: m.id, organization_id: org, scope: "region", branch_id: null, region_id: m.regionId, ...metricCols(m),
        inventory_value: null, slow_moving_value: null, near_expiry_value: null,
      })),
    ],
    users: d.users.map((u) => ({ id: u.id, organization_id: org, auth_user_id: null, employee_id: u.employeeId, display_name: u.displayName, app_role: u.appRole })),
    simulation_sessions: [
      {
        id: d.simulation.id, organization_id: org, user_id: d.users[0]?.id ?? null, status: d.simulation.status,
        start_date: d.simulation.startDate, length_days: d.simulation.lengthDays, current_day: d.simulation.currentDay,
      },
    ],
  };
}

// ============================================================================ rows → dataset

const byStr = <T>(a: T, b: T, key: (x: T) => string) => key(a).localeCompare(key(b));

export function fromRows(t: TableRows): OrgDataset {
  const orgRow = t.organizations[0];
  if (!orgRow) throw new Error("No organisation found. Has the database been seeded?");
  const roleCodeById = new Map(t.roles.map((r) => [str(r.id), str(r.code) as RoleCode]));
  const skillsByEmployee = new Map<string, Array<{ code: string; level: number }>>();
  t.employee_skills.forEach((s) => {
    const list = skillsByEmployee.get(str(s.employee_id)) ?? [];
    list.push({ code: str(s.skill_code), level: num(s.proficiency) });
    skillsByEmployee.set(str(s.employee_id), list);
  });
  const kpisByDept = new Map<string, Row[]>();
  t.department_kpis.forEach((k) => kpisByDept.set(str(k.department_id), [...(kpisByDept.get(str(k.department_id)) ?? []), k]));

  const metric = (m: Row) => ({
    id: str(m.id),
    month: isoDate(m.period_month) as MonthKey,
    salesTarget: num(m.sales_target),
    salesActual: num(m.sales_actual),
    transactions: num(m.transactions),
    stockAvailability: num(m.stock_availability),
    complianceScore: num(m.compliance_score),
    customerSatisfaction: num(m.customer_satisfaction),
    provenance: str(m.provenance) as BranchMetricRecord["provenance"],
  });
  const branchMetric = (m: Row): BranchMetricRecord => ({
    ...metric(m),
    branchId: str(m.branch_id),
    inventoryValue: num(m.inventory_value),
    slowMovingValue: num(m.slow_moving_value),
    nearExpiryValue: num(m.near_expiry_value),
  });

  const session = t.simulation_sessions[0];
  if (!session) throw new Error("No simulation session found.");

  return {
    organization: {
      id: str(orgRow.id), code: str(orgRow.code), name: lt(orgRow, "name"), tagline: lt(orgRow, "tagline"),
      headquarters: lt(orgRow, "headquarters"), foundedYear: num(orgRow.founded_year), isFictional: true,
    },
    roles: t.roles
      .map((r) => ({ id: str(r.id), code: str(r.code) as RoleCode, title: lt(r, "title"), level: num(r.level), workforce: str(r.workforce) as "executive" }))
      .sort((a, b) => a.level - b.level || a.code.localeCompare(b.code)),
    regions: t.regions.map((r) => ({
      id: str(r.id), code: str(r.code), name: lt(r, "name"), cities: json<LocalizedText[]>(r.cities),
      supervisorId: str(r.supervisor_id), isPlayerRegion: Boolean(r.is_player_region), branchCount: num(r.branch_count),
    })),
    departments: t.departments.map((x) => ({
      id: str(x.id), code: str(x.code), name: lt(x, "name"), description: lt(x, "description"),
      headId: str(x.head_id), reportsToId: nullableStr(x.reports_to_id), responsibilities: json<LocalizedText[]>(x.responsibilities),
      kpis: (kpisByDept.get(str(x.id)) ?? []).map((k) => ({
        id: str(k.id), code: str(k.code), name: lt(k, "name"), unit: str(k.unit) as "percent", target: num(k.target_value),
        current: num(k.current_value), direction: str(k.direction) as "higher_is_better",
      })),
      contact: { email: str(x.contact_email), phoneExtension: str(x.contact_extension), location: lt(x, "location") },
    })),
    branches: t.branches
      .map((b) => ({
        id: str(b.id), code: str(b.code), number: num(b.branch_number), name: lt(b, "name"), regionId: str(b.region_id),
        city: lt(b, "city"), district: lt(b, "district"), zone: str(b.zone) as "riyadh_north", performanceGroup: str(b.performance_group) as "A",
        category: str(b.category) as "community", openedYear: num(b.opened_year), areaSqm: num(b.area_sqm), is24Hours: Boolean(b.is_24_hours),
        context: lt(b, "context"),
      }))
      .sort((a, b) => a.number - b.number),
    employees: t.employees.map((e) => ({
      id: str(e.id), employeeCode: str(e.employee_code), fullName: lt(e, "full_name"), gender: str(e.gender) as "male",
      roleCode: roleCodeById.get(str(e.role_id))!, jobTitle: lt(e, "job_title"), branchId: nullableStr(e.branch_id),
      departmentId: nullableStr(e.department_id), regionId: nullableStr(e.region_id), isBranchLeader: Boolean(e.is_branch_leader),
      isPlayer: Boolean(e.is_player), yearsOfExperience: num(e.years_of_experience), hireDate: isoDate(e.hire_date),
      employmentStatus: str(e.employment_status) as "active", email: str(e.email), phoneExtension: str(e.phone_extension),
    })),
    profiles: t.employee_profiles.map((p) => ({
      employeeId: str(p.employee_id), summary: lt(p, "summary"), strengths: arr(p.strengths), developmentAreas: arr(p.development_areas),
      communicationStyle: str(p.communication_style), leadershipStyle: nullableStr(p.leadership_style),
      leadershipPotentialScore: num(p.leadership_potential_score), leadershipPotential: str(p.leadership_potential) as "ready",
      performanceScore: num(p.performance_score), careerAspiration: str(p.career_aspiration),
      personality: {
        openness: num(p.openness), conscientiousness: num(p.conscientiousness), extraversion: num(p.extraversion),
        agreeableness: num(p.agreeableness), emotionalStability: num(p.emotional_stability),
      },
      behavior: json<BehavioralTraits>(p.behavioral_traits),
      skills: skillsByEmployee.get(str(p.employee_id)) ?? [],
    })),
    reportingLines: t.reporting_lines.map((l) => ({
      id: str(l.id), employeeId: str(l.employee_id), managerId: str(l.manager_id), lineType: str(l.line_type) as "solid",
      context: l.context_en === null || l.context_en === undefined ? null : lt(l, "context"),
    })),
    relationships: t.relationships.map((r) => ({
      id: str(r.id), sourceId: str(r.source_id), targetId: str(r.target_id), type: str(r.relationship_type) as Relationship["type"],
      trust: num(r.trust), rapport: num(r.rapport), description: lt(r, "description"),
    })),
    branchMetrics: [
      ...t.metric_snapshots.filter((m) => m.scope === "branch").map(branchMetric),
      ...t.branch_metrics.map(branchMetric),
    ].sort((a, b) => byStr(a, b, (x) => x.branchId) || a.month.localeCompare(b.month)),
    regionMetrics: t.metric_snapshots
      .filter((m) => m.scope === "region")
      .map((m) => ({ ...metric(m), regionId: str(m.region_id) }))
      .sort((a, b) => byStr(a, b, (x) => x.regionId) || a.month.localeCompare(b.month)),
    performanceReviews: t.performance_reviews.map((r) => ({
      id: str(r.id), employeeId: str(r.employee_id), period: str(r.period), periodEnd: isoDate(r.period_end), score: num(r.score),
      provenance: str(r.provenance) as "synthetic_historical",
    })),
    attendance: t.attendance_records.map((a) => ({
      id: str(a.id), employeeId: str(a.employee_id), month: isoDate(a.period_month), scheduledShifts: num(a.scheduled_shifts),
      attendedShifts: num(a.attended_shifts), lateArrivals: num(a.late_arrivals), unplannedAbsences: num(a.unplanned_absences),
      provenance: str(a.provenance) as "synthetic_historical",
    })),
    trainings: t.training_records.map((x) => ({
      id: str(x.id), employeeId: str(x.employee_id), courseCode: str(x.course_code), status: str(x.status) as "completed",
      completedOn: x.completed_on === null || x.completed_on === undefined ? null : isoDate(x.completed_on), hours: num(x.hours),
    })),
    users: t.users.map((u) => ({ id: str(u.id), employeeId: str(u.employee_id), displayName: str(u.display_name), appRole: str(u.app_role) as "player" })),
    simulation: {
      id: str(session.id), status: str(session.status) as SimulationStatus, startDate: isoDate(session.start_date),
      lengthDays: num(session.length_days), currentDay: num(session.current_day),
    },
  };
}

/** Canonical ordering so datasets from different sources can be compared deterministically. */
export function normaliseDataset(d: OrgDataset): OrgDataset {
  const byId = <T extends { id: string }>(xs: T[]) => [...xs].sort((a, b) => a.id.localeCompare(b.id));
  return {
    ...d,
    roles: [...d.roles].sort((a, b) => a.level - b.level || a.code.localeCompare(b.code)),
    regions: byId(d.regions),
    departments: byId(d.departments).map((x) => ({ ...x, kpis: byId(x.kpis) })),
    branches: [...d.branches].sort((a, b) => a.number - b.number),
    employees: byId(d.employees),
    profiles: [...d.profiles]
      .sort((a, b) => a.employeeId.localeCompare(b.employeeId))
      .map((p) => ({ ...p, skills: [...p.skills].sort((a, b) => a.code.localeCompare(b.code)) })),
    reportingLines: byId(d.reportingLines),
    relationships: byId(d.relationships),
    branchMetrics: [...d.branchMetrics].sort((a, b) => a.branchId.localeCompare(b.branchId) || a.month.localeCompare(b.month)),
    regionMetrics: [...d.regionMetrics].sort((a, b) => a.regionId.localeCompare(b.regionId) || a.month.localeCompare(b.month)),
    performanceReviews: byId(d.performanceReviews),
    attendance: byId(d.attendance),
    trainings: byId(d.trainings),
    users: byId(d.users),
  };
}
