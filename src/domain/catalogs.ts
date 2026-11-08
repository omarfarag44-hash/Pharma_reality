/**
 * Controlled vocabularies. Records store stable codes; labels live here in both languages.
 */
import type { LocalizedText } from "./common";

type Catalog = Record<string, LocalizedText>;

export const COMPETENCIES = {
  clinical_knowledge: { en: "Clinical knowledge", ar: "المعرفة السريرية" },
  patient_counseling: { en: "Patient counseling", ar: "إرشاد المرضى" },
  inventory_control: { en: "Inventory control", ar: "ضبط المخزون" },
  sales_conversion: { en: "Sales conversion", ar: "تحويل المبيعات" },
  team_coaching: { en: "Team coaching", ar: "تدريب الفريق وتوجيهه" },
  regulatory_compliance: { en: "Regulatory compliance", ar: "الالتزام التنظيمي" },
  customer_service: { en: "Customer service", ar: "خدمة العملاء" },
  problem_solving: { en: "Problem solving", ar: "حل المشكلات" },
  time_management: { en: "Time management", ar: "إدارة الوقت" },
  data_literacy: { en: "Data literacy", ar: "قراءة البيانات وتحليلها" },
  conflict_resolution: { en: "Conflict resolution", ar: "حل النزاعات" },
  cross_selling: { en: "Cross-selling", ar: "البيع المتقاطع" },
  dermocosmetics: { en: "Dermocosmetics", ar: "مستحضرات العناية بالبشرة" },
  chronic_care: { en: "Chronic disease care", ar: "رعاية الأمراض المزمنة" },
  attention_to_detail: { en: "Attention to detail", ar: "الدقة والانتباه للتفاصيل" },
  adaptability: { en: "Adaptability", ar: "المرونة والتكيّف" },
  planning: { en: "Planning & organisation", ar: "التخطيط والتنظيم" },
  delegation: { en: "Delegation", ar: "التفويض" },
  assertiveness: { en: "Assertiveness", ar: "الحزم" },
  stress_management: { en: "Stress management", ar: "إدارة الضغوط" },
  punctuality: { en: "Punctuality", ar: "الانضباط في المواعيد" },
  commercial_awareness: { en: "Commercial awareness", ar: "الوعي التجاري" },
  digital_tools: { en: "Digital & POS tools", ar: "الأدوات الرقمية وأنظمة البيع" },
  negotiation: { en: "Negotiation", ar: "التفاوض" },
  strategic_thinking: { en: "Strategic thinking", ar: "التفكير الاستراتيجي" },
  stakeholder_management: { en: "Stakeholder management", ar: "إدارة أصحاب المصلحة" },
} satisfies Catalog;
export type CompetencyCode = keyof typeof COMPETENCIES;

export const COMMUNICATION_STYLES = {
  direct: {
    en: "Direct — gets to the point, values speed over diplomacy",
    ar: "مباشر — يدخل في صلب الموضوع ويقدّم السرعة على المجاملة",
  },
  analytical: {
    en: "Analytical — wants facts, numbers and time to think",
    ar: "تحليلي — يحتاج إلى الحقائق والأرقام ووقتًا للتفكير",
  },
  supportive: {
    en: "Supportive — warm, patient, avoids open conflict",
    ar: "داعم — ودود وصبور ويتجنب الخلاف العلني",
  },
  expressive: {
    en: "Expressive — energetic, persuasive, thinks out loud",
    ar: "تعبيري — نشيط ومقنع ويفكّر بصوت مرتفع",
  },
  reserved: {
    en: "Reserved — speaks rarely, prefers written follow-up",
    ar: "متحفظ — قليل الكلام ويفضّل المتابعة الكتابية",
  },
  diplomatic: {
    en: "Diplomatic — careful wording, seeks agreement first",
    ar: "دبلوماسي — يختار كلماته بعناية ويسعى للتوافق أولًا",
  },
} satisfies Catalog;
export type CommunicationStyleCode = keyof typeof COMMUNICATION_STYLES;

export const COMMUNICATION_STYLE_SHORT = {
  direct: { en: "Direct", ar: "مباشر" },
  analytical: { en: "Analytical", ar: "تحليلي" },
  supportive: { en: "Supportive", ar: "داعم" },
  expressive: { en: "Expressive", ar: "تعبيري" },
  reserved: { en: "Reserved", ar: "متحفظ" },
  diplomatic: { en: "Diplomatic", ar: "دبلوماسي" },
} satisfies Record<CommunicationStyleCode, LocalizedText>;

export const LEADERSHIP_STYLES = {
  visionary: { en: "Visionary", ar: "صاحب رؤية" },
  coaching: { en: "Coaching", ar: "توجيهي (كوتشينج)" },
  affiliative: { en: "Affiliative", ar: "تآلفي" },
  democratic: { en: "Democratic", ar: "تشاركي" },
  pacesetting: { en: "Pacesetting", ar: "قدوة في الإيقاع" },
  commanding: { en: "Commanding", ar: "توجيهي حازم" },
} satisfies Catalog;
export type LeadershipStyleCode = keyof typeof LEADERSHIP_STYLES;

export const CAREER_ASPIRATIONS = {
  branch_leader: { en: "Become a Branch Leader", ar: "أن يصبح قائد فرع" },
  area_supervisor: { en: "Move into Area Supervision", ar: "الانتقال إلى الإشراف على منطقة" },
  clinical_specialist: { en: "Clinical specialist track", ar: "مسار التخصص السريري" },
  training_role: { en: "Join Training & Development", ar: "الانضمام إلى التدريب والتطوير" },
  quality_role: { en: "Quality & compliance career", ar: "مسار الجودة والامتثال" },
  category_management: { en: "Category management (Purchasing)", ar: "إدارة الفئات (المشتريات)" },
  operations_management: { en: "Senior operations management", ar: "الإدارة العليا للعمليات" },
  stable_role: { en: "Stay in role, protect work-life balance", ar: "البقاء في الدور مع الحفاظ على التوازن" },
  further_education: { en: "Further study (PharmD / MBA)", ar: "استكمال الدراسة (دكتور صيدلة / ماجستير)" },
  executive_leadership: { en: "Executive leadership", ar: "القيادة التنفيذية" },
} satisfies Catalog;
export type CareerAspirationCode = keyof typeof CAREER_ASPIRATIONS;

export const MOTIVATORS = {
  recognition: { en: "Recognition", ar: "التقدير" },
  growth: { en: "Growth", ar: "النمو المهني" },
  stability: { en: "Stability", ar: "الاستقرار" },
  autonomy: { en: "Autonomy", ar: "الاستقلالية" },
  financial_reward: { en: "Financial reward", ar: "المكافأة المالية" },
  team_belonging: { en: "Team belonging", ar: "الانتماء للفريق" },
  patient_impact: { en: "Patient impact", ar: "الأثر على المرضى" },
  mastery: { en: "Mastery", ar: "الإتقان" },
} satisfies Catalog;

export const STRESS_TRIGGERS = {
  understaffing: { en: "Understaffed shifts", ar: "نقص الطاقم في المناوبات" },
  unclear_priorities: { en: "Unclear priorities", ar: "الأولويات غير الواضحة" },
  public_criticism: { en: "Public criticism", ar: "الانتقاد أمام الآخرين" },
  stock_shortages: { en: "Stock shortages", ar: "نقص المخزون" },
  difficult_customers: { en: "Difficult customers", ar: "العملاء الصعبون" },
  last_minute_changes: { en: "Last-minute changes", ar: "التغييرات المفاجئة" },
  micromanagement: { en: "Micromanagement", ar: "الإدارة التفصيلية المفرطة" },
  target_pressure: { en: "Target pressure", ar: "ضغط المستهدفات" },
} satisfies Catalog;

export const CONFLICT_APPROACHES = {
  confronting: { en: "Confronts directly", ar: "يواجه مباشرة" },
  collaborating: { en: "Collaborates", ar: "يتعاون للوصول لحل" },
  compromising: { en: "Compromises", ar: "يميل إلى الحلول الوسط" },
  avoiding: { en: "Avoids", ar: "يتجنب المواجهة" },
  accommodating: { en: "Accommodates", ar: "يتنازل لإرضاء الآخرين" },
} satisfies Catalog;

export const DECISION_STYLES = {
  intuitive: { en: "Intuitive", ar: "حدسي" },
  data_driven: { en: "Data-driven", ar: "قائم على البيانات" },
  consensus: { en: "Consensus-seeking", ar: "يسعى للإجماع" },
  rule_based: { en: "Rule-based", ar: "ملتزم بالإجراءات" },
} satisfies Catalog;

export const TRAINING_COURSES = {
  "TR-ONB": { en: "Onboarding & store SOPs", ar: "التهيئة وإجراءات التشغيل القياسية" },
  "TR-CNS": { en: "Patient counseling excellence", ar: "التميّز في إرشاد المرضى" },
  "TR-INV": { en: "Inventory & expiry management", ar: "إدارة المخزون وتواريخ الصلاحية" },
  "TR-GDP": { en: "Good dispensing practice & compliance", ar: "ممارسات الصرف الجيدة والامتثال" },
  "TR-SAL": { en: "Consultative selling", ar: "البيع الاستشاري" },
  "TR-LDR": { en: "Branch leadership fundamentals", ar: "أساسيات قيادة الفروع" },
  "TR-DRM": { en: "Dermocosmetics advisory", ar: "الاستشارات في مستحضرات البشرة" },
  "TR-CHR": { en: "Chronic disease management", ar: "إدارة الأمراض المزمنة" },
  "TR-CX": { en: "Customer experience standards", ar: "معايير تجربة العملاء" },
  "TR-DIG": { en: "POS & digital tools", ar: "أنظمة نقاط البيع والأدوات الرقمية" },
  "TR-COA": { en: "Coaching conversations", ar: "محادثات التوجيه والكوتشينج" },
} satisfies Catalog;
export type TrainingCourseCode = keyof typeof TRAINING_COURSES;

export const TRAINING_COURSE_HOURS: Record<TrainingCourseCode, number> = {
  "TR-ONB": 16,
  "TR-CNS": 12,
  "TR-INV": 8,
  "TR-GDP": 10,
  "TR-SAL": 8,
  "TR-LDR": 24,
  "TR-DRM": 12,
  "TR-CHR": 14,
  "TR-CX": 6,
  "TR-DIG": 4,
  "TR-COA": 10,
};

export const BRANCH_CATEGORY_LABELS = {
  flagship: { en: "Flagship", ar: "فرع رئيسي" },
  mall: { en: "Mall", ar: "مركز تجاري" },
  community: { en: "Community", ar: "حي سكني" },
  medical: { en: "Medical-adjacent", ar: "مجاور لمنشأة طبية" },
  highway: { en: "Highway", ar: "طريق رئيسي" },
} satisfies Catalog;

export const PERFORMANCE_GROUP_LABELS = {
  A: { en: "Group A · High performance", ar: "المجموعة أ · أداء مرتفع" },
  B: { en: "Group B · Growth opportunities", ar: "المجموعة ب · فرص نمو" },
  C: { en: "Group C · Recovery zone", ar: "المجموعة ج · منطقة تعافٍ" },
} satisfies Catalog;

export const ZONE_LABELS = {
  riyadh_north: { en: "North Riyadh", ar: "شمال الرياض" },
  riyadh_central_west: { en: "Central & West Riyadh", ar: "وسط وغرب الرياض" },
  riyadh_south_kharj: { en: "South Riyadh & Al-Kharj", ar: "جنوب الرياض والخرج" },
} satisfies Catalog;

export function catalogLabel(catalog: Catalog, code: string): LocalizedText {
  return catalog[code] ?? { en: code, ar: code };
}
