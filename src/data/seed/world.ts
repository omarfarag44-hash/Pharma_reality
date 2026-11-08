/**
 * Hand-authored world definition for NEXUS PHARMACIES (fictional).
 * The generator combines these definitions with deterministic randomness
 * to produce the full organisational dataset.
 */
import type { BranchCategory, PerformanceGroup, Zone } from "@/domain/branch";
import type { Gender, LocalizedText } from "@/domain/common";
import type { Organization, Role } from "@/domain/organization";
import type { PersonalityProfile } from "@/domain/people";

export const SIMULATION_START_DATE = "2027-01-03"; // A Sunday, the first working day of the Saudi week.
export const SIMULATION_LENGTH_DAYS = 90;

/** Six closed historical months followed by the current (opening) month. */
export const HISTORY_MONTHS = [
  "2026-06-01",
  "2026-07-01",
  "2026-08-01",
  "2026-09-01",
  "2026-10-01",
  "2026-11-01",
] as const;
export const CURRENT_MONTH = "2026-12-01";
export const ALL_MONTHS = [...HISTORY_MONTHS, CURRENT_MONTH] as const;

/** Seasonal demand multipliers applied to monthly targets (summer travel dip, winter flu season). */
export const SEASONALITY: Record<string, number> = {
  "2026-06-01": 0.97,
  "2026-07-01": 0.91,
  "2026-08-01": 0.94,
  "2026-09-01": 1.0,
  "2026-10-01": 1.01,
  "2026-11-01": 1.03,
  "2026-12-01": 1.07,
};

export const ORGANIZATION: Omit<Organization, "id"> = {
  code: "NEXUS",
  name: { en: "NEXUS PHARMACIES", ar: "صيدليات نيكسس" },
  tagline: {
    en: "A fictional community pharmacy chain operating across the Kingdom",
    ar: "سلسلة صيدليات مجتمعية خيالية تعمل في مختلف مناطق المملكة",
  },
  headquarters: { en: "Nexus Tower, Riyadh (fictional)", ar: "برج نيكسس، الرياض (خيالي)" },
  foundedYear: 2006,
  isFictional: true,
};

export const ROLES: Omit<Role, "id">[] = [
  { code: "ceo", title: { en: "Chief Executive Officer", ar: "الرئيس التنفيذي" }, level: 1, workforce: "executive" },
  { code: "operations_director", title: { en: "Operations Director", ar: "مدير العمليات" }, level: 2, workforce: "executive" },
  { code: "department_head", title: { en: "Department Head", ar: "رئيس إدارة" }, level: 2, workforce: "corporate" },
  { code: "area_supervisor", title: { en: "Area Supervisor", ar: "مشرف منطقة" }, level: 3, workforce: "field" },
  { code: "department_specialist", title: { en: "Department Specialist", ar: "أخصائي إدارة" }, level: 3, workforce: "corporate" },
  { code: "branch_leader", title: { en: "Branch Leader", ar: "قائد الفرع" }, level: 4, workforce: "branch" },
  { code: "senior_pharmacist", title: { en: "Senior Pharmacist", ar: "صيدلي أول" }, level: 5, workforce: "branch" },
  { code: "pharmacist", title: { en: "Pharmacist", ar: "صيدلي" }, level: 5, workforce: "branch" },
  { code: "junior_pharmacist", title: { en: "Junior Pharmacist", ar: "صيدلي مبتدئ" }, level: 6, workforce: "branch" },
];

export interface RegionSeed {
  code: string;
  name: LocalizedText;
  cities: LocalizedText[];
  branchCount: number;
  isPlayerRegion: boolean;
  /** For peer regions: summarised performance profile used to synthesise region-level history. */
  profile?: { monthlyTarget: number; achievement: number; trend: number; basket: number; stock: number; compliance: number; csat: number };
}

export const REGIONS: RegionSeed[] = [
  {
    code: "CEN",
    name: { en: "Central Region", ar: "المنطقة الوسطى" },
    cities: [
      { en: "Riyadh", ar: "الرياض" },
      { en: "Diriyah", ar: "الدرعية" },
      { en: "Al-Kharj", ar: "الخرج" },
    ],
    branchCount: 15,
    isPlayerRegion: true,
  },
  {
    code: "WST",
    name: { en: "Western Region", ar: "المنطقة الغربية" },
    cities: [
      { en: "Jeddah", ar: "جدة" },
      { en: "Makkah", ar: "مكة المكرمة" },
      { en: "Taif", ar: "الطائف" },
    ],
    branchCount: 18,
    isPlayerRegion: false,
    profile: { monthlyTarget: 12_400_000, achievement: 105.5, trend: 0.3, basket: 134, stock: 95.4, compliance: 90.5, csat: 87 },
  },
  {
    code: "EST",
    name: { en: "Eastern Region", ar: "المنطقة الشرقية" },
    cities: [
      { en: "Dammam", ar: "الدمام" },
      { en: "Al-Khobar", ar: "الخبر" },
      { en: "Al-Ahsa", ar: "الأحساء" },
    ],
    branchCount: 14,
    isPlayerRegion: false,
    profile: { monthlyTarget: 9_300_000, achievement: 99.2, trend: 0.5, basket: 128, stock: 94.6, compliance: 91.8, csat: 89 },
  },
  {
    code: "STH",
    name: { en: "Southern Region", ar: "المنطقة الجنوبية" },
    cities: [
      { en: "Abha", ar: "أبها" },
      { en: "Khamis Mushait", ar: "خميس مشيط" },
      { en: "Jazan", ar: "جازان" },
    ],
    branchCount: 12,
    isPlayerRegion: false,
    profile: { monthlyTarget: 6_900_000, achievement: 89.4, trend: -0.4, basket: 112, stock: 91.2, compliance: 84.5, csat: 82 },
  },
];

/** Hand-authored character used for executives, peers and department heads. */
export interface CharacterSeed {
  key: string;
  name: LocalizedText;
  gender: Gender;
  jobTitle: LocalizedText;
  yearsOfExperience: number;
  tenureYears: number;
  personality: PersonalityProfile;
  communicationStyle: string;
  leadershipStyle: string;
  strengths: string[];
  developmentAreas: string[];
  careerAspiration: string;
  performanceScore: number;
  motivators: string[];
  stressTriggers: string[];
  summary: LocalizedText;
}

export const CEO: CharacterSeed = {
  key: "exec:ceo",
  name: { en: "Dr. Abdulrahman Al-Mansour", ar: "د. عبدالرحمن المنصور" },
  gender: "male",
  jobTitle: { en: "Chief Executive Officer", ar: "الرئيس التنفيذي" },
  yearsOfExperience: 27,
  tenureYears: 9,
  personality: { openness: 78, conscientiousness: 74, extraversion: 66, agreeableness: 52, emotionalStability: 81 },
  communicationStyle: "diplomatic",
  leadershipStyle: "visionary",
  strengths: ["strategic_thinking", "stakeholder_management", "commercial_awareness"],
  developmentAreas: ["delegation"],
  careerAspiration: "executive_leadership",
  performanceScore: 88,
  motivators: ["growth", "recognition"],
  stressTriggers: ["unclear_priorities", "public_criticism"],
  summary: {
    en: "Pharmacist turned executive who built Nexus from 40 to 120+ branches. Thinks in three-year horizons, expects regional leaders to bring options, not problems.",
    ar: "صيدلي تحوّل إلى قائد تنفيذي ونقل نيكسس من 40 إلى أكثر من 120 فرعًا. يفكر بأفق ثلاث سنوات ويتوقع من قادة المناطق تقديم خيارات لا مشكلات.",
  },
};

export const OPERATIONS_DIRECTOR: CharacterSeed = {
  key: "exec:ops-director",
  name: { en: "Majed Al-Suwailem", ar: "ماجد السويلم" },
  gender: "male",
  jobTitle: { en: "Operations Director", ar: "مدير العمليات" },
  yearsOfExperience: 19,
  tenureYears: 6,
  personality: { openness: 55, conscientiousness: 86, extraversion: 58, agreeableness: 47, emotionalStability: 72 },
  communicationStyle: "direct",
  leadershipStyle: "pacesetting",
  strengths: ["data_literacy", "planning", "regulatory_compliance"],
  developmentAreas: ["team_coaching", "conflict_resolution"],
  careerAspiration: "executive_leadership",
  performanceScore: 84,
  motivators: ["mastery", "recognition"],
  stressTriggers: ["unclear_priorities", "target_pressure"],
  summary: {
    en: "Your direct manager. Runs a tight weekly performance review, reads every number, and has little patience for surprises. Rewards supervisors who escalate early with a plan.",
    ar: "مديرك المباشر. يدير مراجعة أداء أسبوعية دقيقة ويقرأ كل رقم ولا يحب المفاجآت. يقدّر المشرفين الذين يصعّدون مبكرًا ومعهم خطة.",
  },
};

export const PLAYER = {
  key: "player:area-supervisor",
  name: { en: "You (Area Supervisor)", ar: "أنت (مشرف المنطقة)" },
  jobTitle: { en: "Area Supervisor — Central Region", ar: "مشرف منطقة — المنطقة الوسطى" },
};

export interface PeerSeed extends CharacterSeed {
  regionCode: string;
  relationship: {
    type: "rivalry" | "collaboration" | "peer";
    trust: number;
    rapport: number;
    description: LocalizedText;
  };
}

export const PEER_SUPERVISORS: PeerSeed[] = [
  {
    key: "peer:western",
    regionCode: "WST",
    name: { en: "Khalid Al-Qarni", ar: "خالد القرني" },
    gender: "male",
    jobTitle: { en: "Area Supervisor — Western Region", ar: "مشرف منطقة — المنطقة الغربية" },
    yearsOfExperience: 14,
    tenureYears: 7,
    personality: { openness: 52, conscientiousness: 78, extraversion: 82, agreeableness: 34, emotionalStability: 66 },
    communicationStyle: "direct",
    leadershipStyle: "pacesetting",
    strengths: ["sales_conversion", "commercial_awareness", "negotiation"],
    developmentAreas: ["team_coaching", "conflict_resolution"],
    careerAspiration: "operations_management",
    performanceScore: 91,
    motivators: ["recognition", "financial_reward"],
    stressTriggers: ["micromanagement", "public_criticism"],
    summary: {
      en: "Top-ranked supervisor for two years running. Delivers numbers through intensity and personal involvement; his teams perform but turnover is the highest in the network.",
      ar: "المشرف الأعلى تصنيفًا لعامين متتاليين. يحقق الأرقام بالحماس والمتابعة الشخصية، وفرقه تؤدي جيدًا لكن معدل دوران الموظفين لديه هو الأعلى في الشبكة.",
    },
    relationship: {
      type: "rivalry",
      trust: 28,
      rapport: 35,
      description: {
        en: "Competitive. Shares results openly but guards methods; sees you as the main rival for the next promotion.",
        ar: "علاقة تنافسية. يشارك النتائج علنًا لكنه يحتفظ بأساليبه؛ يراك المنافس الأبرز على الترقية القادمة.",
      },
    },
  },
  {
    key: "peer:eastern",
    regionCode: "EST",
    name: { en: "Noura Al-Qahtani", ar: "نورة القحطاني" },
    gender: "female",
    jobTitle: { en: "Area Supervisor — Eastern Region", ar: "مشرفة منطقة — المنطقة الشرقية" },
    yearsOfExperience: 12,
    tenureYears: 5,
    personality: { openness: 74, conscientiousness: 71, extraversion: 57, agreeableness: 81, emotionalStability: 70 },
    communicationStyle: "supportive",
    leadershipStyle: "coaching",
    strengths: ["team_coaching", "conflict_resolution", "patient_counseling"],
    developmentAreas: ["assertiveness", "commercial_awareness"],
    careerAspiration: "training_role",
    performanceScore: 85,
    motivators: ["growth", "team_belonging"],
    stressTriggers: ["understaffing", "target_pressure"],
    summary: {
      en: "Builds people before numbers. Lowest staff turnover in the network and a steady upward trend; sometimes slow to address under-performance.",
      ar: "تبني الأشخاص قبل الأرقام. لديها أدنى معدل دوران موظفين في الشبكة واتجاه تصاعدي ثابت، لكنها أحيانًا تتأخر في معالجة ضعف الأداء.",
    },
    relationship: {
      type: "collaboration",
      trust: 72,
      rapport: 68,
      description: {
        en: "Natural ally. Happy to share coaching tools and lend a trainer; expects reciprocity on stock transfers.",
        ar: "حليفة طبيعية. تشارك أدوات التوجيه بسهولة وقد تعير مدربًا؛ وتتوقع المعاملة بالمثل في تحويلات المخزون.",
      },
    },
  },
  {
    key: "peer:southern",
    regionCode: "STH",
    name: { en: "Faisal Al-Shehri", ar: "فيصل الشهري" },
    gender: "male",
    jobTitle: { en: "Area Supervisor — Southern Region", ar: "مشرف منطقة — المنطقة الجنوبية" },
    yearsOfExperience: 9,
    tenureYears: 2,
    personality: { openness: 66, conscientiousness: 82, extraversion: 31, agreeableness: 63, emotionalStability: 49 },
    communicationStyle: "analytical",
    leadershipStyle: "democratic",
    strengths: ["data_literacy", "inventory_control", "attention_to_detail"],
    developmentAreas: ["assertiveness", "stress_management", "stakeholder_management"],
    careerAspiration: "stable_role",
    performanceScore: 71,
    motivators: ["mastery", "stability"],
    stressTriggers: ["target_pressure", "last_minute_changes"],
    summary: {
      en: "Newest supervisor, inherited the toughest region. Excellent with data and inventory, less comfortable in difficult conversations. Under visible pressure from the Operations Director.",
      ar: "أحدث المشرفين وورث المنطقة الأصعب. ممتاز في البيانات والمخزون وأقل ارتياحًا في المحادثات الصعبة. تحت ضغط واضح من مدير العمليات.",
    },
    relationship: {
      type: "peer",
      trust: 54,
      rapport: 47,
      description: {
        en: "Cordial and cautious. Often asks for your view on analytics; could become a strong ally or withdraw under pressure.",
        ar: "علاقة ودية وحذرة. يطلب رأيك كثيرًا في التحليلات؛ قد يصبح حليفًا قويًا أو ينسحب تحت الضغط.",
      },
    },
  },
];

export interface DepartmentMemberSeed {
  title: LocalizedText;
  gender: Gender;
  /** Optional collaboration link with the player. */
  playerLink?: { trust: number; rapport: number; description: LocalizedText };
}

export interface DepartmentSeed {
  code: string;
  name: LocalizedText;
  description: LocalizedText;
  /** "ops-director" means the Operations Director heads the department. */
  head: CharacterSeed | "ops-director";
  members: DepartmentMemberSeed[];
  responsibilities: LocalizedText[];
  kpis: Array<{
    code: string;
    name: LocalizedText;
    unit: "percent" | "days" | "count" | "sar" | "hours" | "score";
    target: number;
    current: number;
    direction: "higher_is_better" | "lower_is_better";
  }>;
  extension: string;
  floor: number;
}

const head = (
  key: string,
  name: LocalizedText,
  gender: Gender,
  jobTitle: LocalizedText,
  rest: Omit<CharacterSeed, "key" | "name" | "gender" | "jobTitle">,
): CharacterSeed => ({ key, name, gender, jobTitle, ...rest });

export const DEPARTMENTS: DepartmentSeed[] = [
  {
    code: "OPS",
    name: { en: "Operations", ar: "العمليات" },
    description: {
      en: "Runs the branch network day to day through regional Area Supervisors and sets operating standards.",
      ar: "تدير شبكة الفروع يوميًا من خلال مشرفي المناطق وتضع معايير التشغيل.",
    },
    head: "ops-director",
    members: [
      {
        title: { en: "Operations Excellence Manager", ar: "مدير التميز التشغيلي" },
        gender: "male",
        playerLink: {
          trust: 58,
          rapport: 52,
          description: { en: "Owns the SOP library and audit follow-ups for your region.", ar: "مسؤول عن مكتبة الإجراءات ومتابعة التدقيق في منطقتك." },
        },
      },
      { title: { en: "Operations Analyst", ar: "محلل عمليات" }, gender: "female" },
    ],
    responsibilities: [
      { en: "Network performance management and weekly reviews", ar: "إدارة أداء الشبكة والمراجعات الأسبوعية" },
      { en: "Branch operating standards and SOPs", ar: "معايير تشغيل الفروع وإجراءاتها القياسية" },
      { en: "Staffing models and shift coverage", ar: "نماذج التوظيف وتغطية المناوبات" },
      { en: "Escalation management across regions", ar: "إدارة التصعيد بين المناطق" },
    ],
    kpis: [
      { code: "OPS-SALES", name: { en: "Network sales achievement", ar: "تحقيق مبيعات الشبكة" }, unit: "percent", target: 100, current: 98.1, direction: "higher_is_better" },
      { code: "OPS-SOP", name: { en: "SOP adherence", ar: "الالتزام بالإجراءات" }, unit: "percent", target: 95, current: 91.4, direction: "higher_is_better" },
      { code: "OPS-COVER", name: { en: "Shift coverage", ar: "تغطية المناوبات" }, unit: "percent", target: 96, current: 96.8, direction: "higher_is_better" },
    ],
    extension: "1100",
    floor: 9,
  },
  {
    code: "HR",
    name: { en: "Human Resources", ar: "الموارد البشرية" },
    description: {
      en: "Attracts, retains and supports the people who run the branches, from hiring to performance management.",
      ar: "تستقطب الموظفين وتحافظ عليهم وتدعمهم، من التوظيف حتى إدارة الأداء.",
    },
    head: head("dept:hr", { en: "Hanan Al-Rifai", ar: "حنان الرفاعي" }, "female", { en: "Head of Human Resources", ar: "رئيسة الموارد البشرية" }, {
      yearsOfExperience: 16, tenureYears: 8,
      personality: { openness: 62, conscientiousness: 76, extraversion: 54, agreeableness: 72, emotionalStability: 74 },
      communicationStyle: "diplomatic", leadershipStyle: "affiliative",
      strengths: ["stakeholder_management", "conflict_resolution", "planning"], developmentAreas: ["data_literacy"],
      careerAspiration: "executive_leadership", performanceScore: 82, motivators: ["team_belonging", "stability"], stressTriggers: ["last_minute_changes", "public_criticism"],
      summary: { en: "Policy-minded and fair. Will support tough people decisions if they are documented and consistent.", ar: "تهتم بالسياسات والعدالة. تدعم القرارات الصعبة المتعلقة بالموظفين إذا كانت موثقة ومتسقة." },
    }),
    members: [
      {
        title: { en: "HR Business Partner — Central", ar: "شريك أعمال الموارد البشرية — الوسطى" },
        gender: "female",
        playerLink: { trust: 61, rapport: 64, description: { en: "Your first call for performance cases, transfers and recruitment.", ar: "جهة الاتصال الأولى لحالات الأداء والنقل والتوظيف." } },
      },
      { title: { en: "Talent Acquisition Specialist", ar: "أخصائي استقطاب المواهب" }, gender: "male" },
      { title: { en: "Payroll & Attendance Officer", ar: "مسؤول الرواتب والحضور" }, gender: "male" },
    ],
    responsibilities: [
      { en: "Recruitment and onboarding of pharmacists", ar: "توظيف الصيادلة وتهيئتهم" },
      { en: "Performance management cycles", ar: "دورات إدارة الأداء" },
      { en: "Attendance, leave and payroll", ar: "الحضور والإجازات والرواتب" },
      { en: "Employee relations and retention", ar: "علاقات الموظفين والمحافظة عليهم" },
    ],
    kpis: [
      { code: "HR-TTF", name: { en: "Time to fill pharmacist vacancy", ar: "مدة شغل وظيفة صيدلي" }, unit: "days", target: 30, current: 38, direction: "lower_is_better" },
      { code: "HR-TURN", name: { en: "Annualised turnover", ar: "معدل الدوران السنوي" }, unit: "percent", target: 12, current: 14.6, direction: "lower_is_better" },
      { code: "HR-REV", name: { en: "Reviews completed on time", ar: "التقييمات المنجزة في وقتها" }, unit: "percent", target: 95, current: 96, direction: "higher_is_better" },
    ],
    extension: "1200",
    floor: 7,
  },
  {
    code: "SCM",
    name: { en: "Supply Chain", ar: "سلسلة الإمداد" },
    description: {
      en: "Moves stock from distribution centre to shelf: replenishment, warehousing and inter-branch transfers.",
      ar: "تنقل المخزون من مركز التوزيع إلى الرف: إعادة التموين والتخزين والتحويلات بين الفروع.",
    },
    head: head("dept:scm", { en: "Ayman Al-Ruwaili", ar: "أيمن الرويلي" }, "male", { en: "Head of Supply Chain", ar: "رئيس سلسلة الإمداد" }, {
      yearsOfExperience: 18, tenureYears: 10,
      personality: { openness: 45, conscientiousness: 84, extraversion: 40, agreeableness: 50, emotionalStability: 68 },
      communicationStyle: "analytical", leadershipStyle: "commanding",
      strengths: ["planning", "inventory_control", "data_literacy"], developmentAreas: ["stakeholder_management", "adaptability"],
      careerAspiration: "operations_management", performanceScore: 79, motivators: ["mastery", "autonomy"], stressTriggers: ["last_minute_changes", "unclear_priorities"],
      summary: { en: "Systems thinker who trusts the replenishment model over branch requests. Responds well to evidence, poorly to urgency without data.", ar: "يفكر بمنطق الأنظمة ويثق بنموذج إعادة التموين أكثر من طلبات الفروع. يستجيب للأدلة ولا يستجيب للاستعجال دون بيانات." },
    }),
    members: [
      { title: { en: "Replenishment Analyst", ar: "محلل إعادة التموين" }, gender: "female" },
      { title: { en: "Distribution Planner — Central", ar: "مخطط التوزيع — الوسطى" }, gender: "male", playerLink: { trust: 44, rapport: 40, description: { en: "Controls delivery slots for your branches; responsive when given notice.", ar: "يتحكم في مواعيد التوريد لفروعك؛ يتجاوب عند إبلاغه مسبقًا." } } },
      { title: { en: "Warehouse Operations Lead", ar: "قائد عمليات المستودع" }, gender: "male" },
    ],
    responsibilities: [
      { en: "Automated replenishment and order planning", ar: "إعادة التموين الآلية وتخطيط الطلبات" },
      { en: "Distribution centre operations", ar: "تشغيل مركز التوزيع" },
      { en: "Inter-branch stock transfers", ar: "تحويلات المخزون بين الفروع" },
      { en: "Cold-chain integrity", ar: "سلامة سلسلة التبريد" },
    ],
    kpis: [
      { code: "SCM-OTIF", name: { en: "On-time in-full deliveries", ar: "التوريد في الوقت وبالكامل" }, unit: "percent", target: 96, current: 93.2, direction: "higher_is_better" },
      { code: "SCM-FILL", name: { en: "Order fill rate", ar: "نسبة تلبية الطلبات" }, unit: "percent", target: 95, current: 95.8, direction: "higher_is_better" },
      { code: "SCM-DOH", name: { en: "Days of inventory on hand", ar: "أيام المخزون المتاح" }, unit: "days", target: 45, current: 52, direction: "lower_is_better" },
    ],
    extension: "1300",
    floor: 4,
  },
  {
    code: "PUR",
    name: { en: "Purchasing", ar: "المشتريات" },
    description: {
      en: "Negotiates with suppliers, manages product categories and decides the range each branch format carries.",
      ar: "تتفاوض مع الموردين وتدير فئات المنتجات وتحدد التشكيلة التي يحملها كل نوع من الفروع.",
    },
    head: head("dept:pur", { en: "Lina Al-Harthy", ar: "لينا الحارثي" }, "female", { en: "Head of Purchasing", ar: "رئيسة المشتريات" }, {
      yearsOfExperience: 15, tenureYears: 6,
      personality: { openness: 70, conscientiousness: 73, extraversion: 69, agreeableness: 44, emotionalStability: 71 },
      communicationStyle: "expressive", leadershipStyle: "visionary",
      strengths: ["negotiation", "commercial_awareness", "strategic_thinking"], developmentAreas: ["attention_to_detail"],
      careerAspiration: "executive_leadership", performanceScore: 86, motivators: ["financial_reward", "autonomy"], stressTriggers: ["micromanagement", "stock_shortages"],
      summary: { en: "Commercially sharp and well connected with suppliers. Pushes promotional ranges that branches sometimes struggle to sell through.", ar: "حادّة تجاريًا وذات علاقات قوية مع الموردين. تدفع بتشكيلات ترويجية تجد الفروع صعوبة أحيانًا في تصريفها." },
    }),
    members: [
      { title: { en: "Category Manager — Pharma & OTC", ar: "مدير فئة — الأدوية والمنتجات دون وصفة" }, gender: "male" },
      { title: { en: "Category Manager — Beauty & Wellness", ar: "مديرة فئة — التجميل والعافية" }, gender: "female", playerLink: { trust: 39, rapport: 50, description: { en: "Allocates promotional stock; your slow-moving beauty stock is a recurring topic.", ar: "توزع مخزون العروض؛ مخزون التجميل بطيء الحركة لديك موضوع متكرر بينكما." } } },
      { title: { en: "Supplier Relations Specialist", ar: "أخصائي علاقات الموردين" }, gender: "male" },
    ],
    responsibilities: [
      { en: "Supplier negotiation and contracts", ar: "التفاوض مع الموردين والعقود" },
      { en: "Category and range management", ar: "إدارة الفئات والتشكيلات" },
      { en: "Pricing and promotional planning", ar: "التسعير وتخطيط العروض" },
      { en: "Return-to-vendor agreements for expiring stock", ar: "اتفاقيات إرجاع المخزون قريب الانتهاء للموردين" },
    ],
    kpis: [
      { code: "PUR-MARGIN", name: { en: "Gross margin", ar: "هامش الربح الإجمالي" }, unit: "percent", target: 33, current: 33.6, direction: "higher_is_better" },
      { code: "PUR-RTV", name: { en: "Expiry stock returned to vendor", ar: "المخزون المنتهي المعاد للموردين" }, unit: "percent", target: 60, current: 48, direction: "higher_is_better" },
      { code: "PUR-OOS", name: { en: "Supplier-driven out-of-stocks", ar: "حالات نفاد بسبب الموردين" }, unit: "count", target: 20, current: 27, direction: "lower_is_better" },
    ],
    extension: "1400",
    floor: 5,
  },
  {
    code: "MKT",
    name: { en: "Marketing", ar: "التسويق" },
    description: {
      en: "Builds the Nexus brand, runs campaigns and the loyalty programme, and drives traffic to branches.",
      ar: "تبني علامة نيكسس وتدير الحملات وبرنامج الولاء وتجذب العملاء إلى الفروع.",
    },
    head: head("dept:mkt", { en: "Rayan Al-Sharif", ar: "ريان الشريف" }, "male", { en: "Head of Marketing", ar: "رئيس التسويق" }, {
      yearsOfExperience: 11, tenureYears: 3,
      personality: { openness: 88, conscientiousness: 55, extraversion: 84, agreeableness: 61, emotionalStability: 63 },
      communicationStyle: "expressive", leadershipStyle: "visionary",
      strengths: ["strategic_thinking", "digital_tools", "stakeholder_management"], developmentAreas: ["planning", "attention_to_detail"],
      careerAspiration: "executive_leadership", performanceScore: 80, motivators: ["recognition", "autonomy"], stressTriggers: ["micromanagement", "unclear_priorities"],
      summary: { en: "Creative and fast-moving. Launches campaigns quickly; branch readiness is not always checked in advance.", ar: "مبدع وسريع الحركة. يطلق الحملات بسرعة، ولا يتم دائمًا التحقق من جاهزية الفروع مسبقًا." },
    }),
    members: [
      { title: { en: "Campaigns Manager", ar: "مديرة الحملات" }, gender: "female" },
      { title: { en: "Loyalty Programme Specialist", ar: "أخصائي برنامج الولاء" }, gender: "male" },
      { title: { en: "In-store Marketing Coordinator", ar: "منسقة التسويق داخل الفروع" }, gender: "female" },
    ],
    responsibilities: [
      { en: "Brand and seasonal campaigns", ar: "حملات العلامة والمواسم" },
      { en: "Loyalty programme and customer CRM", ar: "برنامج الولاء وإدارة علاقات العملاء" },
      { en: "In-store visual merchandising", ar: "العرض المرئي داخل الفروع" },
      { en: "Digital channels and app promotions", ar: "القنوات الرقمية وعروض التطبيق" },
    ],
    kpis: [
      { code: "MKT-LOY", name: { en: "Loyalty share of sales", ar: "حصة الولاء من المبيعات" }, unit: "percent", target: 55, current: 49.5, direction: "higher_is_better" },
      { code: "MKT-ROI", name: { en: "Campaign ROI", ar: "العائد على الحملات" }, unit: "score", target: 3, current: 2.6, direction: "higher_is_better" },
      { code: "MKT-NPS", name: { en: "Brand NPS", ar: "مؤشر صافي الترويج" }, unit: "score", target: 40, current: 41, direction: "higher_is_better" },
    ],
    extension: "1500",
    floor: 6,
  },
  {
    code: "FIN",
    name: { en: "Finance", ar: "المالية" },
    description: {
      en: "Owns budgets, branch P&L reporting, inventory accounting and cost control.",
      ar: "مسؤولة عن الموازنات وتقارير أرباح وخسائر الفروع ومحاسبة المخزون وضبط التكاليف.",
    },
    head: head("dept:fin", { en: "Abdulmajeed Al-Fawzan", ar: "عبدالمجيد الفوزان" }, "male", { en: "Head of Finance", ar: "رئيس المالية" }, {
      yearsOfExperience: 20, tenureYears: 11,
      personality: { openness: 40, conscientiousness: 91, extraversion: 35, agreeableness: 48, emotionalStability: 77 },
      communicationStyle: "reserved", leadershipStyle: "commanding",
      strengths: ["data_literacy", "attention_to_detail", "planning"], developmentAreas: ["stakeholder_management"],
      careerAspiration: "stable_role", performanceScore: 83, motivators: ["stability", "mastery"], stressTriggers: ["last_minute_changes", "unclear_priorities"],
      summary: { en: "Conservative steward of the budget. Approves spend that is quantified, rejects anything framed as 'urgent' without numbers.", ar: "حارس محافظ للموازنة. يوافق على الإنفاق المدعوم بالأرقام ويرفض ما يُقدَّم على أنه عاجل دون أرقام." },
    }),
    members: [
      { title: { en: "Commercial Finance Analyst", ar: "محلل مالي تجاري" }, gender: "female", playerLink: { trust: 50, rapport: 42, description: { en: "Prepares your monthly branch P&L pack.", ar: "تُعدّ حزمة أرباح وخسائر فروعك الشهرية." } } },
      { title: { en: "Inventory Accountant", ar: "محاسب المخزون" }, gender: "male" },
      { title: { en: "Accounts Payable Lead", ar: "قائد الحسابات الدائنة" }, gender: "male" },
    ],
    responsibilities: [
      { en: "Annual budget and monthly forecasting", ar: "الموازنة السنوية والتوقعات الشهرية" },
      { en: "Branch profit and loss reporting", ar: "تقارير أرباح وخسائر الفروع" },
      { en: "Inventory valuation and write-offs", ar: "تقييم المخزون والشطب" },
      { en: "Cost control and spend approval", ar: "ضبط التكاليف واعتماد الإنفاق" },
    ],
    kpis: [
      { code: "FIN-CLOSE", name: { en: "Month-end close", ar: "إغلاق نهاية الشهر" }, unit: "days", target: 6, current: 5, direction: "lower_is_better" },
      { code: "FIN-WO", name: { en: "Inventory write-off rate", ar: "نسبة شطب المخزون" }, unit: "percent", target: 0.8, current: 1.1, direction: "lower_is_better" },
      { code: "FIN-ACC", name: { en: "Forecast accuracy", ar: "دقة التوقعات" }, unit: "percent", target: 95, current: 92.5, direction: "higher_is_better" },
    ],
    extension: "1600",
    floor: 8,
  },
  {
    code: "TND",
    name: { en: "Training & Development", ar: "التدريب والتطوير" },
    description: {
      en: "Develops pharmacists' clinical, service and leadership capabilities through structured programmes.",
      ar: "تطوّر القدرات السريرية والخدمية والقيادية للصيادلة من خلال برامج منظمة.",
    },
    head: head("dept:tnd", { en: "Dr. Nadia Al-Sayegh", ar: "د. نادية الصايغ" }, "female", { en: "Head of Training & Development", ar: "رئيسة التدريب والتطوير" }, {
      yearsOfExperience: 17, tenureYears: 7,
      personality: { openness: 85, conscientiousness: 70, extraversion: 63, agreeableness: 79, emotionalStability: 69 },
      communicationStyle: "supportive", leadershipStyle: "coaching",
      strengths: ["team_coaching", "clinical_knowledge", "planning"], developmentAreas: ["commercial_awareness"],
      careerAspiration: "executive_leadership", performanceScore: 84, motivators: ["growth", "patient_impact"], stressTriggers: ["understaffing", "unclear_priorities"],
      summary: { en: "Believes most performance problems are capability problems. A strong partner if you bring her a clear development need.", ar: "تؤمن بأن معظم مشكلات الأداء مشكلات قدرات. شريكة قوية إذا قدّمت لها احتياجًا تطويريًا واضحًا." },
    }),
    members: [
      { title: { en: "Clinical Trainer", ar: "مدرب سريري" }, gender: "male", playerLink: { trust: 66, rapport: 70, description: { en: "Runs counseling refreshers in your branches on request.", ar: "يقدم دورات إرشاد المرضى في فروعك عند الطلب." } } },
      { title: { en: "Leadership Development Specialist", ar: "أخصائية تطوير القيادات" }, gender: "female" },
      { title: { en: "E-learning Coordinator", ar: "منسق التعلم الإلكتروني" }, gender: "male" },
    ],
    responsibilities: [
      { en: "Onboarding academy for new pharmacists", ar: "أكاديمية تهيئة الصيادلة الجدد" },
      { en: "Clinical and counseling programmes", ar: "البرامج السريرية وبرامج الإرشاد" },
      { en: "Branch leader development pathway", ar: "مسار تطوير قادة الفروع" },
      { en: "Mandatory compliance training tracking", ar: "متابعة التدريب الإلزامي على الامتثال" },
    ],
    kpis: [
      { code: "TND-HRS", name: { en: "Training hours per pharmacist (YTD)", ar: "ساعات التدريب لكل صيدلي (منذ بداية العام)" }, unit: "hours", target: 40, current: 33, direction: "higher_is_better" },
      { code: "TND-MAND", name: { en: "Mandatory training completion", ar: "إكمال التدريب الإلزامي" }, unit: "percent", target: 95, current: 96.5, direction: "higher_is_better" },
      { code: "TND-PIPE", name: { en: "Ready-now leader pipeline", ar: "القادة الجاهزون حاليًا" }, unit: "count", target: 15, current: 9, direction: "higher_is_better" },
    ],
    extension: "1700",
    floor: 3,
  },
  {
    code: "QAC",
    name: { en: "Quality & Compliance", ar: "الجودة والامتثال" },
    description: {
      en: "Protects patients and the licence: audits, dispensing standards, pharmacovigilance and regulatory relations.",
      ar: "تحمي المرضى والترخيص: التدقيق ومعايير الصرف واليقظة الدوائية والعلاقة مع الجهات التنظيمية.",
    },
    head: head("dept:qac", { en: "Dr. Salman Al-Hamoud", ar: "د. سلمان الحمود" }, "male", { en: "Head of Quality & Compliance", ar: "رئيس الجودة والامتثال" }, {
      yearsOfExperience: 21, tenureYears: 9,
      personality: { openness: 48, conscientiousness: 93, extraversion: 38, agreeableness: 55, emotionalStability: 80 },
      communicationStyle: "analytical", leadershipStyle: "commanding",
      strengths: ["regulatory_compliance", "attention_to_detail", "clinical_knowledge"], developmentAreas: ["adaptability", "stakeholder_management"],
      careerAspiration: "stable_role", performanceScore: 87, motivators: ["patient_impact", "mastery"], stressTriggers: ["public_criticism", "last_minute_changes"],
      summary: { en: "Zero tolerance on patient-safety issues. Holds a dotted-line view of every Area Supervisor's compliance results.", ar: "لا يتسامح إطلاقًا في قضايا سلامة المرضى. لديه خط إشراف غير مباشر على نتائج امتثال كل مشرف منطقة." },
    }),
    members: [
      { title: { en: "Compliance Auditor — Central", ar: "مدققة امتثال — الوسطى" }, gender: "female", playerLink: { trust: 47, rapport: 38, description: { en: "Conducts your branches' unannounced audits.", ar: "تُجري التدقيقات المفاجئة على فروعك." } } },
      { title: { en: "Pharmacovigilance Officer", ar: "مسؤول اليقظة الدوائية" }, gender: "male" },
      { title: { en: "Licensing & Regulatory Specialist", ar: "أخصائي التراخيص والشؤون التنظيمية" }, gender: "male" },
    ],
    responsibilities: [
      { en: "Branch compliance audits", ar: "تدقيق امتثال الفروع" },
      { en: "Dispensing and storage standards", ar: "معايير الصرف والتخزين" },
      { en: "Pharmacovigilance and incident reporting", ar: "اليقظة الدوائية والإبلاغ عن الحوادث" },
      { en: "Licences and regulatory inspections", ar: "التراخيص والتفتيش التنظيمي" },
    ],
    kpis: [
      { code: "QAC-AUD", name: { en: "Average audit score", ar: "متوسط درجة التدقيق" }, unit: "score", target: 90, current: 86.3, direction: "higher_is_better" },
      { code: "QAC-CAPA", name: { en: "Corrective actions closed on time", ar: "الإجراءات التصحيحية المغلقة في وقتها" }, unit: "percent", target: 95, current: 88, direction: "higher_is_better" },
      { code: "QAC-INC", name: { en: "Dispensing incidents", ar: "حوادث الصرف" }, unit: "count", target: 6, current: 4, direction: "lower_is_better" },
    ],
    extension: "1800",
    floor: 8,
  },
];

export interface BranchSeed {
  number: number;
  name: LocalizedText;
  city: LocalizedText;
  district: LocalizedText;
  zone: Zone;
  group: PerformanceGroup;
  category: BranchCategory;
  openedYear: number;
  areaSqm: number;
  is24Hours: boolean;
  /** Profile used to synthesise monthly history. */
  monthlyTarget: number;
  achievement: number;
  trend: number;
  basket: number;
  stock: number;
  compliance: number;
  slowMovingPct: number;
  nearExpiryPct: number;
  csat: number;
  attendance: number;
  context: LocalizedText;
}

const RIYADH = { en: "Riyadh", ar: "الرياض" };
const KHARJ = { en: "Al-Kharj", ar: "الخرج" };
const DIRIYAH = { en: "Diriyah", ar: "الدرعية" };

export const BRANCHES: BranchSeed[] = [
  // GROUP A — HIGH PERFORMANCE
  { number: 1, name: { en: "Al-Olaya Flagship", ar: "فرع العليا الرئيسي" }, city: RIYADH, district: { en: "Al-Olaya", ar: "العليا" }, zone: "riyadh_central_west", group: "A", category: "flagship", openedYear: 2012, areaSqm: 420, is24Hours: true,
    monthlyTarget: 1_150_000, achievement: 111.5, trend: 0.4, basket: 148, stock: 97.4, compliance: 95, slowMovingPct: 6, nearExpiryPct: 1.8, csat: 91, attendance: 97.6,
    context: { en: "Highest-traffic branch in the network, serving the business district day and night.", ar: "الفرع الأعلى حركة في الشبكة ويخدم الحي التجاري ليلًا ونهارًا." } },
  { number: 2, name: { en: "Al-Malqa", ar: "فرع الملقا" }, city: RIYADH, district: { en: "Al-Malqa", ar: "الملقا" }, zone: "riyadh_north", group: "A", category: "community", openedYear: 2016, areaSqm: 260, is24Hours: false,
    monthlyTarget: 820_000, achievement: 107.5, trend: 0.6, basket: 162, stock: 96.8, compliance: 93, slowMovingPct: 7, nearExpiryPct: 2.1, csat: 93, attendance: 98,
    context: { en: "Affluent family district with strong loyalty-card penetration and premium basket.", ar: "حي عائلي مرتفع الدخل مع انتشار قوي لبطاقة الولاء وسلة شراء مرتفعة." } },
  { number: 3, name: { en: "Hittin Plaza", ar: "فرع حطين بلازا" }, city: RIYADH, district: { en: "Hittin", ar: "حطين" }, zone: "riyadh_north", group: "A", category: "mall", openedYear: 2018, areaSqm: 230, is24Hours: false,
    monthlyTarget: 760_000, achievement: 105, trend: 0.1, basket: 171, stock: 95.9, compliance: 91, slowMovingPct: 9.5, nearExpiryPct: 2.6, csat: 89, attendance: 96.4,
    context: { en: "Mall branch led by beauty and dermocosmetics; weekend peaks drive most of the month.", ar: "فرع في مركز تجاري تقوده منتجات التجميل والعناية بالبشرة؛ ذروة عطلة نهاية الأسبوع تصنع معظم الشهر." } },
  { number: 4, name: { en: "Diriyah Gate", ar: "فرع بوابة الدرعية" }, city: DIRIYAH, district: { en: "Al-Bujairi", ar: "البجيري" }, zone: "riyadh_central_west", group: "A", category: "community", openedYear: 2019, areaSqm: 210, is24Hours: false,
    monthlyTarget: 640_000, achievement: 103.5, trend: 0.9, basket: 139, stock: 96.2, compliance: 94, slowMovingPct: 7.5, nearExpiryPct: 2, csat: 90, attendance: 97,
    context: { en: "Growing quickly with tourism and new residential projects nearby.", ar: "ينمو بسرعة مع السياحة والمشاريع السكنية الجديدة القريبة." } },
  { number: 5, name: { en: "Al-Yasmin Medical", ar: "فرع الياسمين الطبي" }, city: RIYADH, district: { en: "Al-Yasmin", ar: "الياسمين" }, zone: "riyadh_north", group: "A", category: "medical", openedYear: 2015, areaSqm: 300, is24Hours: true,
    monthlyTarget: 910_000, achievement: 108.5, trend: -0.3, basket: 118, stock: 97.1, compliance: 96, slowMovingPct: 5.5, nearExpiryPct: 1.5, csat: 88, attendance: 96.8,
    context: { en: "Next to a large private hospital; prescription-heavy with demanding clinical counseling.", ar: "بجوار مستشفى خاص كبير؛ يعتمد على الوصفات الطبية ويتطلب إرشادًا سريريًا متقدمًا." } },
  // GROUP B — GROWTH OPPORTUNITIES
  { number: 6, name: { en: "Al-Narjis", ar: "فرع النرجس" }, city: RIYADH, district: { en: "Al-Narjis", ar: "النرجس" }, zone: "riyadh_north", group: "B", category: "community", openedYear: 2022, areaSqm: 220, is24Hours: false,
    monthlyTarget: 600_000, achievement: 95, trend: 1.3, basket: 131, stock: 93.5, compliance: 88, slowMovingPct: 11, nearExpiryPct: 3, csat: 86, attendance: 95.5,
    context: { en: "Young branch in a fast-growing district; traffic rising every month but conversion lags.", ar: "فرع حديث في حي سريع النمو؛ الحركة ترتفع شهريًا لكن التحويل إلى مبيعات متأخر." } },
  { number: 7, name: { en: "Al-Sulimaniyah", ar: "فرع السليمانية" }, city: RIYADH, district: { en: "Al-Sulimaniyah", ar: "السليمانية" }, zone: "riyadh_central_west", group: "B", category: "community", openedYear: 2011, areaSqm: 240, is24Hours: false,
    monthlyTarget: 700_000, achievement: 94, trend: -0.2, basket: 127, stock: 92.8, compliance: 86, slowMovingPct: 12.5, nearExpiryPct: 3.4, csat: 84, attendance: 94.8,
    context: { en: "Mature, stable branch that has plateaued; team is comfortable rather than hungry.", ar: "فرع ناضج ومستقر وصل إلى مرحلة ثبات؛ الفريق مرتاح أكثر منه طموح." } },
  { number: 8, name: { en: "Qurtubah Mall", ar: "فرع قرطبة مول" }, city: RIYADH, district: { en: "Qurtubah", ar: "قرطبة" }, zone: "riyadh_north", group: "B", category: "mall", openedYear: 2020, areaSqm: 250, is24Hours: false,
    monthlyTarget: 680_000, achievement: 91.5, trend: 0.8, basket: 152, stock: 91.9, compliance: 87, slowMovingPct: 14, nearExpiryPct: 3.9, csat: 85, attendance: 95,
    context: { en: "Overstocked on promotional beauty ranges; good basket value but cash tied up in slow stock.", ar: "مخزون زائد من تشكيلات التجميل الترويجية؛ سلة شراء جيدة لكن السيولة محتجزة في مخزون بطيء." } },
  { number: 9, name: { en: "Al-Kharj Central", ar: "فرع الخرج المركزي" }, city: KHARJ, district: { en: "Al-Khaldiyah", ar: "الخالدية" }, zone: "riyadh_south_kharj", group: "B", category: "community", openedYear: 2014, areaSqm: 200, is24Hours: false,
    monthlyTarget: 520_000, achievement: 97, trend: 0.3, basket: 104, stock: 94.1, compliance: 89, slowMovingPct: 10, nearExpiryPct: 2.8, csat: 87, attendance: 96,
    context: { en: "Loyal local customer base; close to target but limited by lower price-point basket.", ar: "قاعدة عملاء محلية وفية؛ قريب من المستهدف لكن سلة الشراء منخفضة السعر تحدّ من النمو." } },
  { number: 10, name: { en: "Eastern Ring Road", ar: "فرع الدائري الشرقي" }, city: RIYADH, district: { en: "Al-Rawdah", ar: "الروضة" }, zone: "riyadh_north", group: "B", category: "highway", openedYear: 2017, areaSqm: 190, is24Hours: true,
    monthlyTarget: 560_000, achievement: 90, trend: -0.5, basket: 96, stock: 92.3, compliance: 85, slowMovingPct: 13, nearExpiryPct: 3.6, csat: 83, attendance: 94.2,
    context: { en: "Drive-by traffic on a major road; night shifts are hard to staff consistently.", ar: "حركة عابرة على طريق رئيسي؛ يصعب تغطية المناوبات الليلية بشكل منتظم." } },
  // GROUP C — RECOVERY ZONE
  { number: 11, name: { en: "Al-Aziziyah", ar: "فرع العزيزية" }, city: RIYADH, district: { en: "Al-Aziziyah", ar: "العزيزية" }, zone: "riyadh_south_kharj", group: "C", category: "community", openedYear: 2010, areaSqm: 210, is24Hours: false,
    monthlyTarget: 540_000, achievement: 83, trend: -1.4, basket: 92, stock: 88.5, compliance: 78, slowMovingPct: 17, nearExpiryPct: 5.2, csat: 77, attendance: 92.5,
    context: { en: "A competitor opened 200 metres away five months ago; target achievement has slipped almost every month since.", ar: "افتتح منافس على بعد 200 متر قبل خمسة أشهر؛ وتراجعت نسبة تحقيق المستهدف في معظم الأشهر منذ ذلك الحين." } },
  { number: 12, name: { en: "Al-Shifa", ar: "فرع الشفا" }, city: RIYADH, district: { en: "Al-Shifa", ar: "الشفا" }, zone: "riyadh_south_kharj", group: "C", category: "community", openedYear: 2009, areaSqm: 180, is24Hours: false,
    monthlyTarget: 480_000, achievement: 79, trend: -0.6, basket: 88, stock: 87.2, compliance: 74, slowMovingPct: 19, nearExpiryPct: 6.1, csat: 75, attendance: 91.8,
    context: { en: "Ageing store with chronic availability gaps and a team that has lost confidence.", ar: "فرع قديم يعاني فجوات مزمنة في توفر المنتجات وفريق فقد ثقته." } },
  { number: 13, name: { en: "Al-Kharj Industrial", ar: "فرع الخرج الصناعي" }, city: KHARJ, district: { en: "Industrial City", ar: "المدينة الصناعية" }, zone: "riyadh_south_kharj", group: "C", category: "highway", openedYear: 2013, areaSqm: 170, is24Hours: false,
    monthlyTarget: 430_000, achievement: 75.5, trend: 1.5, basket: 85, stock: 89.4, compliance: 76, slowMovingPct: 16, nearExpiryPct: 4.8, csat: 79, attendance: 93,
    context: { en: "New Branch Leader appointed four months ago; early signs of recovery from a low base.", ar: "تم تعيين قائد فرع جديد قبل أربعة أشهر؛ مؤشرات تعافٍ مبكرة من قاعدة منخفضة." } },
  { number: 14, name: { en: "Al-Badiah", ar: "فرع البديعة" }, city: RIYADH, district: { en: "Al-Badiah", ar: "البديعة" }, zone: "riyadh_central_west", group: "C", category: "community", openedYear: 2008, areaSqm: 190, is24Hours: false,
    monthlyTarget: 450_000, achievement: 84, trend: -0.9, basket: 90, stock: 86.6, compliance: 71, slowMovingPct: 21, nearExpiryPct: 6.8, csat: 74, attendance: 90.5,
    context: { en: "Failed its last compliance audit on storage and expiry controls; corrective plan overdue.", ar: "أخفق في آخر تدقيق امتثال بسبب التخزين وضبط الصلاحية؛ وخطة التصحيح متأخرة." } },
  { number: 15, name: { en: "Al-Uraija", ar: "فرع العريجاء" }, city: RIYADH, district: { en: "Al-Uraija", ar: "العريجاء" }, zone: "riyadh_central_west", group: "C", category: "community", openedYear: 2012, areaSqm: 175, is24Hours: false,
    monthlyTarget: 470_000, achievement: 80, trend: 0.2, basket: 87, stock: 88.1, compliance: 77, slowMovingPct: 18, nearExpiryPct: 5.5, csat: 76, attendance: 91,
    context: { en: "Price-sensitive neighbourhood; staffing instability over the last two quarters.", ar: "حي حساس للأسعار؛ عدم استقرار في الطاقم خلال الربعين الماضيين." } },
];

/** Branch-specific roster overrides that make the story coherent. */
export const ROSTER_OVERRIDES: Record<number, { leaderTenureYears?: number; leaderPerformanceDelta?: number; onLeavePosition?: number }> = {
  11: { leaderPerformanceDelta: -6 },
  13: { leaderTenureYears: 0.4, leaderPerformanceDelta: 6 },
  7: { onLeavePosition: 3 },
  12: { onLeavePosition: 4 },
};
