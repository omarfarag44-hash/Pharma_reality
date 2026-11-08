/**
 * Deterministic generator for the NEXUS PHARMACIES organisational world.
 *
 * generateDataset() always returns the same dataset for the same SEED_VERSION.
 * It is the single source for both DEMO MODE and the SQL seed file.
 */
import { TRAINING_COURSE_HOURS, type TrainingCourseCode } from "@/domain/catalogs";
import type { Branch, BranchMetricRecord, RegionMetricRecord } from "@/domain/branch";
import type { Gender, LocalizedText } from "@/domain/common";
import type { OrgDataset } from "@/domain/dataset";
import type { Department, Region, Role, RoleCode } from "@/domain/organization";
import type {
  AttendanceRecord,
  Employee,
  EmployeeProfile,
  PerformanceReview,
  Relationship,
  ReportingLine,
  TrainingRecord,
} from "@/domain/people";
import { emailFor, NamePicker } from "./names";
import {
  assembleProfile,
  buildSkills,
  buildSummary,
  deriveCommunicationStyle,
  generatePersonality,
  pickBehavior,
  pickCareerAspiration,
  pickStrengthsAndGaps,
} from "./profile-builder";
import { clamp, createRng, round, stableUuid } from "./random";
import {
  ALL_MONTHS,
  BRANCHES,
  CEO,
  CURRENT_MONTH,
  DEPARTMENTS,
  OPERATIONS_DIRECTOR,
  ORGANIZATION,
  PEER_SUPERVISORS,
  PLAYER,
  REGIONS,
  ROLES,
  ROSTER_OVERRIDES,
  SEASONALITY,
  SIMULATION_LENGTH_DAYS,
  SIMULATION_START_DATE,
  type BranchSeed,
  type CharacterSeed,
} from "./world";

const ROLE_TITLE: Record<RoleCode, LocalizedText> = Object.fromEntries(
  ROLES.map((r) => [r.code, r.title]),
) as Record<RoleCode, LocalizedText>;

const QUARTERS = [
  { period: "2026-Q1", end: "2026-03-31" },
  { period: "2026-Q2", end: "2026-06-30" },
  { period: "2026-Q3", end: "2026-09-30" },
  { period: "2026-Q4", end: "2026-12-31" },
];

function hireDateFromTenure(tenureYears: number, key: string): string {
  const start = new Date(`${SIMULATION_START_DATE}T00:00:00Z`);
  const rng = createRng(`hire:${key}`);
  const days = Math.round(tenureYears * 365 + rng.int(0, 60));
  start.setUTCDate(start.getUTCDate() - days);
  return start.toISOString().slice(0, 10);
}

function firstNameOf(name: LocalizedText): LocalizedText {
  return {
    en: name.en.replace(/^Dr\.\s*/, "").split(" ")[0]!,
    ar: name.ar.replace(/^د\.\s*/, "").split(" ")[0]!,
  };
}

function genderedTitle(roleCode: RoleCode, gender: Gender): LocalizedText {
  const base = ROLE_TITLE[roleCode];
  if (gender === "male") return base;
  const arFeminine: Partial<Record<RoleCode, string>> = {
    branch_leader: "قائدة الفرع",
    senior_pharmacist: "صيدلانية أولى",
    pharmacist: "صيدلانية",
    junior_pharmacist: "صيدلانية مبتدئة",
  };
  return { en: base.en, ar: arFeminine[roleCode] ?? base.ar };
}

export function generateDataset(): OrgDataset {
  const organizationId = stableUuid("org:nexus");
  const roles: Role[] = ROLES.map((r) => ({ ...r, id: stableUuid(`role:${r.code}`) }));

  // Names of hand-authored characters are reserved so generated people never collide with them.
  const reserved: LocalizedText[] = [
    CEO.name,
    OPERATIONS_DIRECTOR.name,
    ...PEER_SUPERVISORS.map((p) => p.name),
    ...DEPARTMENTS.flatMap((d) => (d.head === "ops-director" ? [] : [d.head.name])),
  ];
  const names = new NamePicker(reserved);

  const employees: Employee[] = [];
  const profiles: EmployeeProfile[] = [];
  const reportingLines: ReportingLine[] = [];
  const relationships: Relationship[] = [];
  const performanceReviews: PerformanceReview[] = [];
  const attendance: AttendanceRecord[] = [];
  const trainings: TrainingRecord[] = [];

  let corporateSeq = 10001;
  const nextCorporateCode = () => `NX-${corporateSeq++}`;

  const addReview = (employeeId: string, finalScore: number, key: string) => {
    const rng = createRng(`reviews:${key}`);
    const slope = rng.float(-3, 3.5);
    QUARTERS.forEach((q, i) => {
      const score = i === QUARTERS.length - 1 ? finalScore : Math.round(clamp(finalScore - slope * (QUARTERS.length - 1 - i) + rng.float(-2.5, 2.5), 40, 99));
      performanceReviews.push({
        id: stableUuid(`review:${key}:${q.period}`),
        employeeId,
        period: q.period,
        periodEnd: q.end,
        score,
        provenance: q.period === "2026-Q4" ? "simulated_current" : "synthetic_historical",
      });
    });
  };

  const addReportingLine = (employeeId: string, managerId: string, lineType: "solid" | "dotted" = "solid", context: LocalizedText | null = null) => {
    reportingLines.push({ id: stableUuid(`line:${employeeId}:${managerId}:${lineType}`), employeeId, managerId, lineType, context });
  };

  const addRelationship = (sourceId: string, targetId: string, type: Relationship["type"], trust: number, rapport: number, description: LocalizedText) => {
    relationships.push({ id: stableUuid(`rel:${sourceId}:${targetId}:${type}`), sourceId, targetId, type, trust: Math.round(trust), rapport: Math.round(rapport), description });
  };

  const addCharacter = (seed: CharacterSeed, roleCode: RoleCode, extra: Partial<Employee>): Employee => {
    const id = stableUuid(`employee:${seed.key}`);
    const employee: Employee = {
      id,
      employeeCode: nextCorporateCode(),
      fullName: seed.name,
      gender: seed.gender,
      roleCode,
      jobTitle: seed.jobTitle,
      branchId: null,
      departmentId: null,
      regionId: null,
      isBranchLeader: false,
      isPlayer: false,
      yearsOfExperience: seed.yearsOfExperience,
      hireDate: hireDateFromTenure(seed.tenureYears, seed.key),
      employmentStatus: "active",
      email: emailFor(seed.name),
      phoneExtension: "",
      ...extra,
    };
    employees.push(employee);
    const rng = createRng(`character:${seed.key}`);
    profiles.push(
      assembleProfile({
        employeeId: id,
        summary: seed.summary,
        strengths: seed.strengths,
        developmentAreas: seed.developmentAreas,
        communicationStyle: seed.communicationStyle,
        leadershipStyle: seed.leadershipStyle,
        performanceScore: seed.performanceScore,
        careerAspiration: seed.careerAspiration,
        personality: seed.personality,
        behavior: { ...pickBehavior(rng, seed.personality), motivators: seed.motivators, stressTriggers: seed.stressTriggers },
        skills: buildSkills(rng, seed.strengths, seed.developmentAreas, roleCode),
        years: seed.yearsOfExperience,
      }),
    );
    addReview(id, seed.performanceScore, seed.key);
    return employee;
  };

  // ---------------------------------------------------------------- Departments (ids first)
  const departmentIds = Object.fromEntries(DEPARTMENTS.map((d) => [d.code, stableUuid(`department:${d.code}`)]));

  // ---------------------------------------------------------------- Executives
  const ceo = addCharacter(CEO, "ceo", { phoneExtension: "1001" });
  const opsDirector = addCharacter(OPERATIONS_DIRECTOR, "operations_director", { departmentId: departmentIds.OPS!, phoneExtension: "1002" });
  addReportingLine(opsDirector.id, ceo.id);
  addRelationship(opsDirector.id, ceo.id, "manager", 74, 61, {
    en: "Trusted lieutenant; the CEO relies on him for network-wide execution.",
    ar: "ذراع تنفيذي موثوق؛ يعتمد عليه الرئيس التنفيذي في التنفيذ على مستوى الشبكة.",
  });

  // ---------------------------------------------------------------- Regions & supervisors
  const regionIds = Object.fromEntries(REGIONS.map((r) => [r.code, stableUuid(`region:${r.code}`)]));
  const playerId = stableUuid(`employee:${PLAYER.key}`);
  const player: Employee = {
    id: playerId,
    employeeCode: nextCorporateCode(),
    fullName: PLAYER.name,
    gender: "male",
    roleCode: "area_supervisor",
    jobTitle: PLAYER.jobTitle,
    branchId: null,
    departmentId: departmentIds.OPS!,
    regionId: regionIds.CEN!,
    isBranchLeader: false,
    isPlayer: true,
    yearsOfExperience: 10,
    hireDate: SIMULATION_START_DATE,
    employmentStatus: "active",
    email: "area.supervisor.central@nexus-pharmacies.example",
    phoneExtension: "2101",
  };
  employees.push(player);
  addReportingLine(playerId, opsDirector.id);
  addRelationship(playerId, opsDirector.id, "manager", 50, 45, {
    en: "New reporting relationship. He expects a 30-day diagnosis of your region and no surprises in weekly reviews.",
    ar: "علاقة إدارية جديدة. يتوقع منك تشخيصًا لمنطقتك خلال 30 يومًا ودون مفاجآت في المراجعات الأسبوعية.",
  });

  const peerIds: Record<string, string> = {};
  PEER_SUPERVISORS.forEach((peer, i) => {
    const e = addCharacter(peer, "area_supervisor", {
      regionId: regionIds[peer.regionCode]!,
      departmentId: departmentIds.OPS!,
      phoneExtension: `21${i + 2}`.padEnd(4, "0"),
    });
    peerIds[peer.regionCode] = e.id;
    addReportingLine(e.id, opsDirector.id);
    addRelationship(playerId, e.id, peer.relationship.type, peer.relationship.trust, peer.relationship.rapport, peer.relationship.description);
  });
  // Peer-to-peer dynamics among the other supervisors.
  addRelationship(peerIds.WST!, peerIds.STH!, "friction", 22, 30, {
    en: "Openly compares regional rankings in leadership meetings, which Faisal finds demoralising.",
    ar: "يقارن ترتيب المناطق علنًا في اجتماعات القيادة، وهو ما يجده فيصل محبطًا.",
  });
  addRelationship(peerIds.EST!, peerIds.STH!, "mentorship", 70, 64, {
    en: "Noura informally coaches Faisal on difficult staff conversations.",
    ar: "تقدّم نورة توجيهًا غير رسمي لفيصل في المحادثات الصعبة مع الموظفين.",
  });

  const regions: Region[] = REGIONS.map((r) => ({
    id: regionIds[r.code]!,
    code: r.code,
    name: r.name,
    cities: r.cities,
    supervisorId: r.isPlayerRegion ? playerId : peerIds[r.code]!,
    isPlayerRegion: r.isPlayerRegion,
    branchCount: r.branchCount,
  }));

  // ---------------------------------------------------------------- Departments
  const departments: Department[] = [];
  DEPARTMENTS.forEach((d) => {
    const deptId = departmentIds[d.code]!;
    let headId: string;
    if (d.head === "ops-director") {
      headId = opsDirector.id;
    } else {
      const h = addCharacter(d.head, "department_head", { departmentId: deptId, phoneExtension: d.extension });
      headId = h.id;
      addReportingLine(h.id, ceo.id);
    }
    d.members.forEach((m, idx) => {
      const key = `dept:${d.code}:member:${idx}`;
      const rng = createRng(key);
      const name = names.next(rng, m.gender);
      const personality = generatePersonality(rng, "department_specialist");
      const { strengths, developmentAreas } = pickStrengthsAndGaps(rng, personality, "department_specialist", false);
      const years = rng.int(4, 14);
      const performance = Math.round(rng.normal(78, 6, 60, 94));
      const id = stableUuid(`employee:${key}`);
      employees.push({
        id,
        employeeCode: nextCorporateCode(),
        fullName: name,
        gender: m.gender,
        roleCode: "department_specialist",
        jobTitle: m.title,
        branchId: null,
        departmentId: deptId,
        regionId: null,
        isBranchLeader: false,
        isPlayer: false,
        yearsOfExperience: years,
        hireDate: hireDateFromTenure(Math.min(years, rng.int(1, 8)), key),
        employmentStatus: "active",
        email: emailFor(name),
        phoneExtension: String(Number(d.extension) + idx + 1),
      });
      const careerAspiration = pickCareerAspiration(rng, "department_specialist", "developing", personality);
      profiles.push(
        assembleProfile({
          employeeId: id,
          summary: buildSummary(firstNameOf(name), m.gender, years, strengths, developmentAreas),
          strengths,
          developmentAreas,
          communicationStyle: deriveCommunicationStyle(personality),
          leadershipStyle: null,
          performanceScore: performance,
          careerAspiration,
          personality,
          behavior: pickBehavior(rng, personality),
          skills: buildSkills(rng, strengths, developmentAreas, "department_specialist"),
          years,
        }),
      );
      addReview(id, performance, key);
      addReportingLine(id, headId);
      if (m.playerLink) {
        addRelationship(playerId, id, "collaboration", m.playerLink.trust, m.playerLink.rapport, m.playerLink.description);
      }
    });
    departments.push({
      id: deptId,
      code: d.code,
      name: d.name,
      description: d.description,
      headId,
      reportsToId: d.head === "ops-director" ? ceo.id : ceo.id,
      responsibilities: d.responsibilities,
      kpis: d.kpis.map((k) => ({ ...k, id: stableUuid(`kpi:${k.code}`) })),
      contact: {
        email: `${d.code.toLowerCase()}@nexus-pharmacies.example`,
        phoneExtension: d.extension,
        location: { en: `Nexus Tower, floor ${d.floor}`, ar: `برج نيكسس، الطابق ${d.floor}` },
      },
    });
  });

  // Quality & Compliance has a dotted line over every Area Supervisor's compliance results.
  const qacHeadId = departments.find((d) => d.code === "QAC")!.headId;
  [playerId, ...Object.values(peerIds)].forEach((supervisorId) =>
    addReportingLine(supervisorId, qacHeadId, "dotted", {
      en: "Compliance results and audit follow-up",
      ar: "نتائج الامتثال ومتابعة التدقيق",
    }),
  );

  // ---------------------------------------------------------------- Branches, staff & metrics
  const branches: Branch[] = [];
  const branchMetrics: BranchMetricRecord[] = [];

  BRANCHES.forEach((seed) => {
    const code = `NX-C${String(seed.number).padStart(2, "0")}`;
    const branchId = stableUuid(`branch:${code}`);
    branches.push({
      id: branchId,
      code,
      number: seed.number,
      name: seed.name,
      regionId: regionIds.CEN!,
      city: seed.city,
      district: seed.district,
      zone: seed.zone,
      performanceGroup: seed.group,
      category: seed.category,
      openedYear: seed.openedYear,
      areaSqm: seed.areaSqm,
      is24Hours: seed.is24Hours,
      context: seed.context,
    });

    const staff = generateBranchStaff(seed, code, branchId, regionIds.CEN!, names);
    staff.forEach(({ employee, profile, tenureYears }) => {
      employees.push(employee);
      profiles.push(profile);
      addReview(employee.id, profile.performanceScore, employee.employeeCode);
      attendance.push(...generateAttendance(employee, seed));
      trainings.push(...generateTrainings(employee, profile, tenureYears));
    });

    const [leader, ...team] = staff.map((s) => s.employee);
    addReportingLine(leader!.id, playerId);
    team.forEach((m) => addReportingLine(m.id, leader!.id));
    generateBranchRelationships(seed, staff, playerId).forEach((r) => relationships.push(r));

    branchMetrics.push(...generateBranchMetrics(seed, branchId, code));
  });

  // ---------------------------------------------------------------- Peer region summaries
  const regionMetrics: RegionMetricRecord[] = REGIONS.filter((r) => r.profile).flatMap((r) => {
    const p = r.profile!;
    const rng = createRng(`region-metrics:${r.code}`);
    return ALL_MONTHS.map((month, i) => {
      const target = Math.round((p.monthlyTarget * SEASONALITY[month]!) / 1000) * 1000;
      const ach = p.achievement + p.trend * (i - (ALL_MONTHS.length - 1)) + rng.float(-1.4, 1.4);
      const sales = Math.round(target * (ach / 100));
      const basket = p.basket * (1 + rng.float(-0.025, 0.025));
      return {
        id: stableUuid(`region-metric:${r.code}:${month}`),
        regionId: regionIds[r.code]!,
        month,
        salesTarget: target,
        salesActual: sales,
        transactions: Math.round(sales / basket),
        stockAvailability: round(clamp(p.stock + rng.float(-0.8, 0.8), 80, 99.5), 1),
        complianceScore: round(clamp(p.compliance + rng.float(-1.5, 1.5), 60, 99), 1),
        customerSatisfaction: round(clamp(p.csat + rng.float(-1.5, 1.5), 60, 99), 1),
        provenance: month === CURRENT_MONTH ? "simulated_current" : "synthetic_historical",
      } satisfies RegionMetricRecord;
    });
  });

  return {
    organization: { id: organizationId, ...ORGANIZATION },
    roles,
    regions,
    departments,
    branches,
    employees,
    profiles,
    reportingLines,
    relationships,
    branchMetrics,
    regionMetrics,
    performanceReviews,
    attendance,
    trainings,
    users: [{ id: stableUuid("user:demo-player"), employeeId: playerId, displayName: "Demo Area Supervisor", appRole: "player" }],
    simulation: {
      id: stableUuid("simulation:default"),
      status: "active",
      startDate: SIMULATION_START_DATE,
      lengthDays: SIMULATION_LENGTH_DAYS,
      currentDay: 1,
    },
  };
}

// ======================================================================== Branch staff

interface GeneratedStaff {
  employee: Employee;
  profile: EmployeeProfile;
  tenureYears: number;
}

function generateBranchStaff(seed: BranchSeed, branchCode: string, branchId: string, regionId: string, names: NamePicker): GeneratedStaff[] {
  const rng = createRng(`roster:${branchCode}`);
  const overrides = ROSTER_OVERRIDES[seed.number] ?? {};
  const secondRole: RoleCode = seed.areaSqm >= 230 || seed.group === "A" ? "senior_pharmacist" : "pharmacist";
  const fourthRole: RoleCode = rng.chance(0.6) ? "junior_pharmacist" : "pharmacist";
  const roster: RoleCode[] = ["branch_leader", secondRole, "pharmacist", fourthRole];
  const groupBase = { A: 84, B: 76, C: 68 }[seed.group];

  return roster.map((roleCode, idx) => {
    const position = idx + 1;
    const employeeCode = `NX-2${String(seed.number).padStart(2, "0")}${String(position).padStart(2, "0")}`;
    const key = `staff:${employeeCode}`;
    const prng = createRng(key);
    const gender: Gender = prng.chance(0.55) ? "male" : "female";
    const name = names.next(prng, gender);
    const years =
      roleCode === "branch_leader" ? prng.int(7, 18)
      : roleCode === "senior_pharmacist" ? prng.int(6, 12)
      : roleCode === "junior_pharmacist" ? prng.int(0, 2)
      : prng.int(2, 7);
    let tenureYears = Math.min(years, round(prng.float(0.5, Math.max(0.6, years * 0.8)), 1));
    if (roleCode === "branch_leader" && overrides.leaderTenureYears !== undefined) tenureYears = overrides.leaderTenureYears;
    if (roleCode === "junior_pharmacist") tenureYears = Math.min(tenureYears, round(prng.float(0.2, 1.5), 1));

    const personality = generatePersonality(prng, roleCode);
    let performance = prng.normal(groupBase + (roleCode === "branch_leader" ? 2 : 0) + (roleCode === "junior_pharmacist" ? -3 : 0), 7, 48, 97);
    if (roleCode === "branch_leader" && overrides.leaderPerformanceDelta) performance += overrides.leaderPerformanceDelta;
    // Conscientious people trend slightly higher.
    performance += (personality.conscientiousness - 55) * 0.06;
    const performanceScore = Math.round(clamp(performance, 45, 97));

    const { strengths, developmentAreas } = pickStrengthsAndGaps(prng, personality, roleCode, seed.group === "C");
    const careerAspiration = pickCareerAspiration(
      prng,
      roleCode,
      performanceScore >= 82 ? "high" : performanceScore >= 74 ? "ready" : "developing",
      personality,
    );
    const employmentStatus =
      overrides.onLeavePosition === position ? "on_leave"
      : tenureYears < 0.5 && roleCode !== "branch_leader" ? "probation"
      : "active";

    const id = stableUuid(`employee:${key}`);
    const employee: Employee = {
      id,
      employeeCode,
      fullName: name,
      gender,
      roleCode,
      jobTitle: genderedTitle(roleCode, gender),
      branchId,
      departmentId: null,
      regionId,
      isBranchLeader: roleCode === "branch_leader",
      isPlayer: false,
      yearsOfExperience: years,
      hireDate: hireDateFromTenure(tenureYears, key),
      employmentStatus,
      email: emailFor(name),
      phoneExtension: `3${String(seed.number).padStart(2, "0")}${position}`,
    };
    const profile = assembleProfile({
      employeeId: id,
      summary: buildSummary(firstNameOf(name), gender, years, strengths, developmentAreas),
      strengths,
      developmentAreas,
      communicationStyle: deriveCommunicationStyle(personality),
      leadershipStyle: roleCode === "branch_leader" ? pickLeadershipStyle(personality) : null,
      performanceScore,
      careerAspiration,
      personality,
      behavior: pickBehavior(prng, personality),
      skills: buildSkills(prng, strengths, developmentAreas, roleCode),
      years,
    });
    return { employee, profile, tenureYears };
  });
}

function pickLeadershipStyle(p: { openness: number; conscientiousness: number; extraversion: number; agreeableness: number }): string {
  if (p.agreeableness >= 65 && p.openness >= 55) return "coaching";
  if (p.agreeableness >= 65) return "affiliative";
  if (p.conscientiousness >= 70 && p.extraversion >= 55) return "pacesetting";
  if (p.extraversion >= 62 && p.agreeableness < 50) return "commanding";
  if (p.openness >= 65) return "visionary";
  return "democratic";
}

function generateAttendance(employee: Employee, seed: BranchSeed): AttendanceRecord[] {
  const rng = createRng(`attendance:${employee.employeeCode}`);
  const reliability = rng.normal(0, 1.4, -3, 3);
  const hire = new Date(`${employee.hireDate}T00:00:00Z`);
  return ALL_MONTHS.flatMap((month) => {
    const monthEnd = new Date(`${month}T00:00:00Z`);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    if (hire >= monthEnd) return [];
    let scheduled = 26;
    if (employee.employmentStatus === "on_leave" && month === CURRENT_MONTH) scheduled = 4;
    const rate = clamp(seed.attendance + reliability + rng.float(-1.5, 1.5), 82, 100) / 100;
    const attended = Math.min(scheduled, Math.round(scheduled * rate));
    const absences = scheduled - attended;
    const late = Math.max(0, Math.round(rng.float(0, 4) + (100 - seed.attendance) * 0.25 - reliability * 0.6));
    return [
      {
        id: stableUuid(`attendance:${employee.employeeCode}:${month}`),
        employeeId: employee.id,
        month,
        scheduledShifts: scheduled,
        attendedShifts: attended,
        lateArrivals: late,
        unplannedAbsences: absences,
        provenance: month === CURRENT_MONTH ? "simulated_current" : "synthetic_historical",
      } satisfies AttendanceRecord,
    ];
  });
}

const DEVELOPMENT_COURSE: Partial<Record<string, TrainingCourseCode>> = {
  patient_counseling: "TR-CNS",
  clinical_knowledge: "TR-CHR",
  chronic_care: "TR-CHR",
  inventory_control: "TR-INV",
  regulatory_compliance: "TR-GDP",
  sales_conversion: "TR-SAL",
  cross_selling: "TR-SAL",
  commercial_awareness: "TR-SAL",
  team_coaching: "TR-COA",
  delegation: "TR-LDR",
  conflict_resolution: "TR-COA",
  customer_service: "TR-CX",
  digital_tools: "TR-DIG",
  dermocosmetics: "TR-DRM",
  data_literacy: "TR-DIG",
};

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function generateTrainings(employee: Employee, profile: EmployeeProfile, tenureYears: number): TrainingRecord[] {
  const rng = createRng(`training:${employee.employeeCode}`);
  const out: TrainingRecord[] = [];
  const add = (courseCode: TrainingCourseCode, status: TrainingRecord["status"], completedOn: string | null) => {
    if (out.some((t) => t.courseCode === courseCode)) return;
    out.push({ id: stableUuid(`training:${employee.employeeCode}:${courseCode}`), employeeId: employee.id, courseCode, status, completedOn, hours: TRAINING_COURSE_HOURS[courseCode] });
  };
  add("TR-ONB", "completed", addDays(employee.hireDate, 21));
  if (tenureYears >= 0.5) add("TR-GDP", "completed", addDays(employee.hireDate, rng.int(60, 150)));
  else add("TR-GDP", "in_progress", null);
  if (employee.isBranchLeader) {
    if (tenureYears < 1) add("TR-LDR", "in_progress", null);
    else add("TR-LDR", "completed", addDays(employee.hireDate, rng.int(120, 300)));
  }
  // One completed course aligned with a strength (that is often how strengths are built).
  const strengthCourse = profile.strengths.map((s) => DEVELOPMENT_COURSE[s]).find(Boolean);
  if (strengthCourse && tenureYears >= 1) add(strengthCourse, "completed", addDays(SIMULATION_START_DATE, -rng.int(40, 300)));
  // Development needs map to planned or in-progress courses.
  profile.developmentAreas.forEach((d) => {
    const c = DEVELOPMENT_COURSE[d];
    if (c) add(c, rng.chance(0.4) ? "in_progress" : "planned", null);
  });
  return out;
}

function generateBranchRelationships(seed: BranchSeed, staff: GeneratedStaff[], playerId: string): Relationship[] {
  const rng = createRng(`relationships:${seed.number}`);
  const out: Relationship[] = [];
  const [leader, ...team] = staff;
  const rel = (s: string, t: string, type: Relationship["type"], trust: number, rapport: number, description: LocalizedText) =>
    out.push({ id: stableUuid(`rel:${s}:${t}:${type}`), sourceId: s, targetId: t, type, trust: Math.round(clamp(trust, -100, 100)), rapport: Math.round(clamp(rapport, -100, 100)), description });

  // Player ↔ Branch Leader: starting trust reflects branch situation.
  const baseTrust = { A: 58, B: 46, C: 30 }[seed.group];
  rel(playerId, leader!.employee.id, "manager", baseTrust + rng.float(-8, 8), baseTrust + rng.float(-10, 6), {
    en: seed.group === "C" ? "Guarded. Previous supervisors cycled through quickly; expects blame before support." : seed.group === "B" ? "Professional and open, waiting to see what you prioritise." : "Confident and proud of results; wants autonomy more than direction.",
    ar: seed.group === "C" ? "حذر. تعاقب عليه مشرفون سابقون بسرعة ويتوقع اللوم قبل الدعم." : seed.group === "B" ? "مهني ومنفتح وينتظر ليرى أولوياتك." : "واثق وفخور بالنتائج؛ يريد الاستقلالية أكثر من التوجيه.",
  });

  // Leader → each team member (manager view).
  team.forEach((m) => {
    const compat = 100 - Math.abs(leader!.profile.personality.agreeableness - m.profile.personality.agreeableness) - Math.abs(leader!.profile.personality.conscientiousness - m.profile.personality.conscientiousness) * 0.5;
    const trust = compat * 0.6 + m.profile.performanceScore * 0.3 + rng.float(-10, 10) - 20;
    rel(leader!.employee.id, m.employee.id, "manager", trust, trust + rng.float(-8, 8), {
      en: trust >= 45 ? "Relies on them for key shifts." : trust >= 25 ? "Solid working relationship with occasional friction on priorities." : "Strained: disagreements over workload and standards.",
      ar: trust >= 45 ? "يعتمد عليه في المناوبات المهمة." : trust >= 25 ? "علاقة عمل جيدة مع احتكاك أحيانًا حول الأولويات." : "علاقة متوترة: خلافات حول عبء العمل والمعايير.",
    });
  });

  // Mentorship from the most experienced non-leader to the junior, if any.
  const junior = team.find((m) => m.employee.roleCode === "junior_pharmacist");
  const senior = [...team].sort((a, b) => b.employee.yearsOfExperience - a.employee.yearsOfExperience)[0];
  if (junior && senior && senior !== junior) {
    rel(senior.employee.id, junior.employee.id, "mentorship", rng.float(50, 80), rng.float(45, 80), {
      en: "Informal mentor on dispensing and counseling.",
      ar: "مرشد غير رسمي في الصرف والإرشاد.",
    });
  }

  // One peer dynamic per branch: friction more likely in recovery branches.
  const [a, b] = rng.shuffle(team);
  if (a && b) {
    const frictionChance = { A: 0.2, B: 0.4, C: 0.65 }[seed.group];
    if (rng.chance(frictionChance)) {
      rel(a.employee.id, b.employee.id, "friction", rng.float(-30, 10), rng.float(-35, 5), {
        en: "Recurring tension over shift swaps and who handles difficult customers.",
        ar: "توتر متكرر حول تبديل المناوبات ومن يتعامل مع العملاء الصعبين.",
      });
    } else {
      rel(a.employee.id, b.employee.id, "friendship", rng.float(55, 85), rng.float(60, 90), {
        en: "Close colleagues who cover for each other.",
        ar: "زميلان مقرّبان يغطي كل منهما الآخر.",
      });
    }
  }
  return out;
}

function generateBranchMetrics(seed: BranchSeed, branchId: string, code: string): BranchMetricRecord[] {
  const rng = createRng(`metrics:${code}`);
  const last = ALL_MONTHS.length - 1;
  return ALL_MONTHS.map((month, i) => {
    const offset = i - last; // 0 for current month, negative for history
    const target = Math.round((seed.monthlyTarget * SEASONALITY[month]!) / 1000) * 1000;
    const achievement = seed.achievement + seed.trend * offset + rng.normal(0, 1.6, -4, 4);
    const salesActual = Math.round(target * (achievement / 100));
    const basket = seed.basket * (1 + rng.float(-0.03, 0.03));
    const transactions = Math.round(salesActual / basket);
    const inventoryValue = Math.round((salesActual * rng.float(1.05, 1.25)) / 100) * 100;
    const trendFactor = seed.trend * offset * 0.15; // operational indicators drift with sales trend
    const stock = round(clamp(seed.stock + trendFactor + rng.float(-0.9, 0.9), 75, 99.8), 1);
    const compliance = round(clamp(seed.compliance + trendFactor * 2 + rng.float(-2, 2), 50, 100), 1);
    const slowPct = clamp(seed.slowMovingPct - trendFactor + rng.float(-1.2, 1.2), 2, 35);
    const expiryPct = clamp(seed.nearExpiryPct - trendFactor * 0.3 + rng.float(-0.4, 0.4), 0.5, 12);
    const csat = round(clamp(seed.csat + trendFactor + rng.float(-1.5, 1.5), 50, 99), 1);
    return {
      id: stableUuid(`branch-metric:${code}:${month}`),
      branchId,
      month,
      salesTarget: target,
      salesActual,
      transactions,
      stockAvailability: stock,
      inventoryValue,
      slowMovingValue: Math.round((inventoryValue * slowPct) / 100),
      nearExpiryValue: Math.round((inventoryValue * expiryPct) / 100),
      complianceScore: compliance,
      customerSatisfaction: csat,
      provenance: month === CURRENT_MONTH ? "simulated_current" : "synthetic_historical",
    };
  });
}
