/**
 * Knowledge base: the scientific and practical sources behind the simulation's rules.
 *
 * Primary references are peer-reviewed research and established textbooks.
 * Company material (for example an internal leadership programme) is added later
 * as a SECONDARY source and never overrides these entries.
 *
 * `kind` separates what research supports from frameworks and teaching models:
 * - research:   tested in peer-reviewed studies (often meta-analyses)
 * - framework:  a practical tool used by organisations, with partial evidence
 * - teaching:   a model that is useful for teaching, with weak or mixed evidence
 */
import type { LocalizedText } from "@/domain/common";

export type SourceKind = "research" | "framework" | "teaching";
export type EvidenceLevel = "strong" | "moderate" | "mixed" | "limited";

export interface KnowledgeEntry {
  id: string;
  name: LocalizedText;
  kind: SourceKind;
  evidence: EvidenceLevel;
  summary: LocalizedText;
  /** APA-style citations. */
  sources: string[];
  competencies: LocalizedText[];
  /** Scenario keys (or engine features) that apply this entry. */
  usedIn: string[];
  /** How the simulation turns the idea into rules. */
  criteria: LocalizedText;
  recommendation: LocalizedText;
  caution?: LocalizedText;
}

const c = (en: string, ar: string): LocalizedText => ({ en, ar });

export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "situational-leadership",
    name: c("Situational Leadership (development level × style)", "القيادة الموقفية (مستوى التطور × الأسلوب)"),
    kind: "teaching",
    evidence: "mixed",
    summary: c(
      "A leader adapts direction and support to the follower's competence and commitment on a specific task: Directing (S1), Coaching (S2), Supporting (S3), Delegating (S4) for development levels D1–D4.",
      "يكيّف القائد مقدار التوجيه والدعم حسب كفاءة الشخص والتزامه في مهمة محددة: التوجيه (S1)، الإرشاد (S2)، الدعم (S3)، التفويض (S4) لمستويات التطور D1–D4.",
    ),
    sources: [
      "Hersey, P., & Blanchard, K. H. (1969). Life cycle theory of leadership. Training and Development Journal, 23(5), 26–34.",
      "Blanchard, K., Zigarmi, P., & Zigarmi, D. (1985). Leadership and the One Minute Manager. William Morrow.",
      "Graeff, C. L. (1997). Evolution of situational leadership theory: A critical review. The Leadership Quarterly, 8(2), 153–170.",
      "Thompson, G., & Vecchio, R. P. (2009). Situational leadership theory: A test of three versions. The Leadership Quarterly, 20(5), 837–848.",
    ],
    competencies: [c("Diagnosing development level", "تشخيص مستوى التطور"), c("Flexing leadership style", "تنويع الأسلوب القيادي"), c("Delegation", "التفويض")],
    usedIn: ["resisting_feedback", "losing_confidence", "new_employee_errors", "refuses_responsibility", "pharmacist_conflict", "leader_missing_targets", "roster_approval", "branch_visit"],
    criteria: c(
      "Development level is diagnosed per task: D4 if competence ≥ 4/5 and commitment ≥ 60; D3 if competence ≥ 3; otherwise D1 if commitment ≥ 55, else D2. A matched style makes the decision's business effect 30% stronger; two or more steps off cuts it to 70% or 50%.",
      "يُشخَّص مستوى التطور لكل مهمة: D4 إذا كانت الكفاءة ≥ 4/5 والالتزام ≥ 60؛ D3 إذا كانت الكفاءة ≥ 3؛ وإلا D1 إذا كان الالتزام ≥ 55، وإلا D2. الأسلوب المناسب يجعل الأثر العملي للقرار أقوى 30%، والابتعاد بخطوتين أو أكثر يخفضه إلى 70% أو 50%.",
    ),
    recommendation: c("Diagnose the person on THIS task before choosing how much to direct or support.", "شخّص الشخص في هذه المهمة تحديدًا قبل أن تقرر مقدار التوجيه أو الدعم."),
    caution: c(
      "Empirical tests support the idea of adapting to the follower only partly; the exact matching rule is not well supported. The simulation uses it as a teaching model, not as proven science.",
      "الاختبارات العلمية تدعم فكرة التكيّف مع الشخص بشكل جزئي فقط، وقاعدة المطابقة الدقيقة غير مدعومة جيدًا. تستخدمها المحاكاة كنموذج تعليمي وليس كعلم مثبت.",
    ),
  },
  {
    id: "self-determination",
    name: c("Self-Determination Theory", "نظرية تقرير المصير"),
    kind: "research",
    evidence: "strong",
    summary: c(
      "Motivation is sustained when three needs are met: autonomy, competence and relatedness. Controlling supervision undermines intrinsic motivation.",
      "يستمر الدافع عندما تُلبّى ثلاث حاجات: الاستقلالية، والكفاءة، والانتماء. الإشراف المتحكم يُضعف الدافع الداخلي.",
    ),
    sources: [
      "Deci, E. L., & Ryan, R. M. (2000). The \"what\" and \"why\" of goal pursuits: Human needs and the self-determination of behavior. Psychological Inquiry, 11(4), 227–268.",
      "Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. American Psychologist, 55(1), 68–78.",
    ],
    competencies: [c("Motivating others", "تحفيز الآخرين"), c("Giving autonomy", "منح الاستقلالية")],
    usedIn: ["character-engine", "resisting_feedback", "refuses_responsibility"],
    criteria: c(
      "In the Character Engine, actions tagged autonomy or development raise commitment, more for people motivated by autonomy or growth. Close supervision lowers it for capable people and for anyone stressed by micromanagement.",
      "في محرك الشخصيات، الأفعال الموسومة بالاستقلالية أو التطوير ترفع الالتزام، وأكثر لمن يحفزهم الاستقلال أو النمو. والإشراف اللصيق يخفضه لدى الأكفاء ولمن يضايقهم الإشراف الزائد.",
    ),
    recommendation: c("Give capable people choice in how they work; explain the why when you must direct.", "امنح الأكفاء حرية اختيار طريقة العمل، واشرح السبب عندما تضطر إلى التوجيه."),
  },
  {
    id: "two-factor",
    name: c("Herzberg's Two-Factor Theory", "نظرية العاملين لهيرزبرج"),
    kind: "teaching",
    evidence: "mixed",
    summary: c(
      "Hygiene factors (pay, conditions, supervision) prevent dissatisfaction; motivators (achievement, recognition, responsibility) create satisfaction.",
      "عوامل الصحة (الأجر، الظروف، الإشراف) تمنع عدم الرضا، والمحفزات (الإنجاز، التقدير، المسؤولية) تصنع الرضا.",
    ),
    sources: [
      "Herzberg, F., Mausner, B., & Snyderman, B. B. (1959). The Motivation to Work. Wiley.",
      "House, R. J., & Wigdor, L. A. (1967). Herzberg's dual-factor theory of job satisfaction and motivation: A review of the evidence and a criticism. Personnel Psychology, 20(4), 369–389.",
    ],
    competencies: [c("Recognition", "التقدير"), c("Job enrichment", "إثراء الوظيفة")],
    usedIn: ["refuses_responsibility", "losing_confidence"],
    criteria: c("Recognition and responsibility are separate action tags with positive effects; they are not treated as the same as pay or conditions.", "التقدير والمسؤولية وسمان منفصلان بأثر إيجابي، ولا يُعاملان مثل الأجر أو ظروف العمل."),
    recommendation: c("Use recognition and real responsibility to motivate; fix hygiene problems to stop complaints.", "استخدم التقدير والمسؤولية الحقيقية للتحفيز، وعالج مشاكل الصحة لإيقاف الشكاوى."),
    caution: c("The strict split between the two factors has not held up well in later studies.", "الفصل الصارم بين العاملين لم يصمد جيدًا في الدراسات اللاحقة."),
  },
  {
    id: "maslow",
    name: c("Maslow's Hierarchy of Needs", "هرم ماسلو للحاجات"),
    kind: "teaching",
    evidence: "limited",
    summary: c("Needs are arranged from physiological and safety needs up to esteem and self-actualisation.", "الحاجات مرتبة من الحاجات الجسدية والأمان حتى التقدير وتحقيق الذات."),
    sources: [
      "Maslow, A. H. (1943). A theory of human motivation. Psychological Review, 50(4), 370–396.",
      "Wahba, M. A., & Bridwell, L. G. (1976). Maslow reconsidered: A review of research on the need hierarchy theory. Organizational Behavior and Human Performance, 15(2), 212–240.",
    ],
    competencies: [c("Understanding needs", "فهم الحاجات")],
    usedIn: [],
    criteria: c("Not used as a rule. Kept for reference because it is widely taught.", "لا يُستخدم كقاعدة. موجود كمرجع لأنه يُدرَّس على نطاق واسع."),
    recommendation: c("Use it as a conversation aid, not as a prediction tool.", "استخدمه كأداة للحوار، وليس للتنبؤ."),
    caution: c("Research found little support for a fixed order of needs.", "الأبحاث لم تجد دعمًا يُذكر لترتيب ثابت للحاجات."),
  },
  {
    id: "team-development",
    name: c("Stages of Team Development", "مراحل تطور الفريق"),
    kind: "teaching",
    evidence: "limited",
    summary: c("Teams move through forming, storming, norming, performing and adjourning.", "تمر الفرق بمراحل التكوين، والعصف، والمعايير، والأداء، والانفضاض."),
    sources: [
      "Tuckman, B. W. (1965). Developmental sequence in small groups. Psychological Bulletin, 63(6), 384–399.",
      "Tuckman, B. W., & Jensen, M. A. C. (1977). Stages of small-group development revisited. Group & Organization Studies, 2(4), 419–427.",
    ],
    competencies: [c("Team building", "بناء الفريق")],
    usedIn: ["pharmacist_conflict"],
    criteria: c("Conflict between colleagues is modelled as a relationship that can improve or break down depending on how it is handled.", "الخلاف بين الزملاء يُنمذج كعلاقة قد تتحسن أو تنهار حسب طريقة التعامل معها."),
    recommendation: c("Expect friction in new or changing teams and make norms explicit.", "توقّع الاحتكاك في الفرق الجديدة أو المتغيرة واجعل القواعد واضحة."),
    caution: c("The stages are a useful description, but teams do not always move through them in order.", "المراحل وصف مفيد، لكن الفرق لا تمر بها دائمًا بهذا الترتيب."),
  },
  {
    id: "transformational",
    name: c("Transformational and Transactional Leadership", "القيادة التحويلية والتبادلية"),
    kind: "research",
    evidence: "strong",
    summary: c(
      "Transformational leaders inspire, develop and give individual consideration; transactional leaders set clear exchanges and rewards. Both relate to performance.",
      "القادة التحويليون يُلهمون ويطوّرون ويهتمون بكل فرد، والقادة التبادليون يضعون اتفاقات ومكافآت واضحة. وكلاهما مرتبط بالأداء.",
    ),
    sources: [
      "Bass, B. M. (1985). Leadership and Performance Beyond Expectations. Free Press.",
      "Judge, T. A., & Piccolo, R. F. (2004). Transformational and transactional leadership: A meta-analytic test of their relative validity. Journal of Applied Psychology, 89(5), 755–768.",
    ],
    competencies: [c("Inspiring", "الإلهام"), c("Individual consideration", "الاهتمام الفردي")],
    usedIn: ["leadership-dna", "khalid_poach"],
    criteria: c("The People development dimension of Leadership DNA rises with options that develop and consider individuals.", "يرتفع بُعد تطوير الأفراد في البصمة القيادية مع الخيارات التي تطوّر الأفراد وتهتم بهم."),
    recommendation: c("Combine clear expectations with individual development.", "اجمع بين التوقعات الواضحة وتطوير كل فرد."),
  },
  {
    id: "emotional-intelligence",
    name: c("Emotional Intelligence", "الذكاء العاطفي"),
    kind: "research",
    evidence: "moderate",
    summary: c("The ability to perceive, use, understand and manage emotions in oneself and others.", "القدرة على إدراك المشاعر واستخدامها وفهمها وإدارتها لدى النفس والآخرين."),
    sources: [
      "Mayer, J. D., Salovey, P., & Caruso, D. R. (2008). Emotional intelligence: New ability or eclectic traits? American Psychologist, 63(6), 503–517.",
      "Joseph, D. L., & Newman, D. A. (2010). Emotional intelligence: An integrative meta-analysis and cascading model. Journal of Applied Psychology, 95(1), 54–78.",
    ],
    competencies: [c("Empathy", "التعاطف"), c("Managing emotions", "إدارة المشاعر")],
    usedIn: ["losing_confidence", "character-engine"],
    criteria: c("People with low emotional stability react more strongly to negative actions; support helps them more.", "الأشخاص ذوو الاتزان الانفعالي المنخفض يتأثرون أكثر بالأفعال السلبية، والدعم يفيدهم أكثر."),
    recommendation: c("Read the emotional state before the task problem.", "اقرأ الحالة العاطفية قبل مشكلة المهمة."),
    caution: c("Self-report EI measures overlap heavily with personality; ability measures are better supported.", "مقاييس الذكاء العاطفي الذاتية تتداخل كثيرًا مع الشخصية، ومقاييس القدرة أفضل دعمًا."),
  },
  {
    id: "grow",
    name: c("GROW coaching model", "نموذج GROW للتوجيه"),
    kind: "framework",
    evidence: "limited",
    summary: c("A coaching conversation moves through Goal, Reality, Options and Will (way forward).", "محادثة التوجيه تمر بالهدف، والواقع، والخيارات، والإرادة (الخطوة التالية)."),
    sources: ["Whitmore, J. (1992). Coaching for Performance. Nicholas Brealey."],
    competencies: [c("Coaching", "التوجيه"), c("Asking questions", "طرح الأسئلة")],
    usedIn: ["coaching-plans", "resisting_feedback"],
    criteria: c("Coaching plans and coaching-style options ask the person for their own plan, then agree a goal.", "خطط التوجيه والخيارات ذات أسلوب التوجيه تطلب من الشخص خطته، ثم يُتفق على هدف."),
    recommendation: c("Ask before telling; end every coaching talk with an agreed next step.", "اسأل قبل أن تُخبر، وأنهِ كل حديث توجيهي بخطوة متفق عليها."),
    caution: c("A widely used practitioner model; research supports workplace coaching in general more than GROW specifically.", "نموذج عملي واسع الانتشار، والأبحاث تدعم التوجيه في العمل بشكل عام أكثر من نموذج GROW تحديدًا."),
  },
  {
    id: "big-five",
    name: c("Big Five personality traits", "السمات الخمس الكبرى للشخصية"),
    kind: "research",
    evidence: "strong",
    summary: c("Openness, conscientiousness, extraversion, agreeableness and emotional stability. Conscientiousness predicts job performance across jobs.", "الانفتاح، والضمير الحي، والانبساط، والتوافق، والاتزان الانفعالي. الضمير الحي يتنبأ بالأداء الوظيفي في معظم الوظائف."),
    sources: [
      "Costa, P. T., & McCrae, R. R. (1992). Revised NEO Personality Inventory (NEO PI-R) and NEO Five-Factor Inventory (NEO-FFI) professional manual. Psychological Assessment Resources.",
      "Barrick, M. R., & Mount, M. K. (1991). The Big Five personality dimensions and job performance: A meta-analysis. Personnel Psychology, 44(1), 1–26.",
    ],
    competencies: [c("Understanding people", "فهم الناس")],
    usedIn: ["character-engine"],
    criteria: c(
      "Every character has Big Five scores. Baseline commitment = 25 + conscientiousness × 0.25 + emotional stability × 0.15 + (performance − 50) × 0.3. Agreeableness changes how formal actions and listening are received.",
      "لكل شخصية درجات في السمات الخمس. الالتزام الأساسي = 25 + الضمير الحي × 0.25 + الاتزان الانفعالي × 0.15 + (الأداء − 50) × 0.3. والتوافق يغيّر طريقة استقبال الأفعال الرسمية والاستماع.",
    ),
    recommendation: c("Adapt how you communicate to the person, not only to the task.", "كيّف طريقة تواصلك مع الشخص، وليس مع المهمة فقط."),
  },
  {
    id: "disc",
    name: c("DISC behavioural styles", "أنماط DISC السلوكية"),
    kind: "teaching",
    evidence: "limited",
    summary: c("Four behavioural styles: Dominance, Influence, Steadiness, Conscientiousness.", "أربعة أنماط سلوكية: السيطرة، والتأثير، والثبات، والالتزام بالدقة."),
    sources: ["Marston, W. M. (1928). Emotions of Normal People. Kegan Paul, Trench, Trubner & Co."],
    competencies: [c("Communication styles", "أنماط التواصل")],
    usedIn: ["character-engine"],
    criteria: c("Only the idea of communication styles is used, for how characters word their reactions. Behaviour rules use the Big Five instead.", "تُستخدم فكرة أنماط التواصل فقط لصياغة ردود الشخصيات. أما قواعد السلوك فتعتمد على السمات الخمس الكبرى."),
    recommendation: c("Use DISC as a shared language for communication, not for decisions about people.", "استخدم DISC كلغة مشتركة للتواصل، وليس لاتخاذ قرارات عن الأشخاص."),
    caution: c("DISC has limited validity evidence and should not be used for selection or evaluation.", "أدلة صدق DISC محدودة، ولا ينبغي استخدامه في الاختيار أو التقييم."),
  },
  {
    id: "goal-setting",
    name: c("Goal-Setting Theory", "نظرية تحديد الأهداف"),
    kind: "research",
    evidence: "strong",
    summary: c("Specific, difficult goals with feedback lead to higher performance than vague goals, when people are committed to them.", "الأهداف المحددة والصعبة مع التغذية الراجعة تؤدي إلى أداء أعلى من الأهداف الغامضة، عندما يكون الناس ملتزمين بها."),
    sources: ["Locke, E. A., & Latham, G. P. (2002). Building a practically useful theory of goal setting and task motivation: A 35-year odyssey. American Psychologist, 57(9), 705–717."],
    competencies: [c("Setting goals", "تحديد الأهداف"), c("Performance management", "إدارة الأداء")],
    usedIn: ["resisting_feedback", "leader_missing_targets", "first_priorities"],
    criteria: c("Options that set a specific goal raise results; options that agree the goal with the person also protect commitment.", "الخيارات التي تحدد هدفًا واضحًا ترفع النتائج، والخيارات التي تتفق على الهدف مع الشخص تحافظ أيضًا على التزامه."),
    recommendation: c("Make goals specific and agree them, so the person owns them.", "اجعل الأهداف محددة واتفق عليها، حتى يتبناها الشخص."),
  },
  {
    id: "feedback-interventions",
    name: c("Feedback Intervention Theory", "نظرية التدخل بالتغذية الراجعة"),
    kind: "research",
    evidence: "strong",
    summary: c("Feedback improves performance on average, but about a third of feedback interventions make performance worse, especially when it targets the person rather than the task.", "التغذية الراجعة تحسّن الأداء في المتوسط، لكن نحو ثلث تدخلاتها يُسوء الأداء، خاصة عندما تستهدف الشخص لا المهمة."),
    sources: ["Kluger, A. N., & DeNisi, A. (1996). The effects of feedback interventions on performance: A historical review, a meta-analysis, and a preliminary feedback intervention theory. Psychological Bulletin, 119(2), 254–284."],
    competencies: [c("Giving feedback", "تقديم الملاحظات")],
    usedIn: ["resisting_feedback", "losing_confidence", "character-engine"],
    criteria: c("Public or pressuring actions lower the reaction score, more for people stressed by public criticism or target pressure.", "الأفعال العلنية أو الضاغطة تخفض درجة رد الفعل، وأكثر لدى من يضايقهم النقد العلني أو ضغط الأهداف."),
    recommendation: c("Give feedback in private and about the task, not the person.", "قدّم الملاحظات على انفراد وعن المهمة، وليس عن الشخص."),
  },
  {
    id: "conflict-modes",
    name: c("Thomas-Kilmann conflict modes", "أنماط الصراع لتوماس وكيلمان"),
    kind: "framework",
    evidence: "moderate",
    summary: c("Five ways to handle conflict: competing, collaborating, compromising, avoiding and accommodating.", "خمس طرق للتعامل مع الصراع: التنافس، والتعاون، والتسوية، والتجنب، والتكيّف."),
    sources: ["Thomas, K. W., & Kilmann, R. H. (1974). Thomas-Kilmann Conflict Mode Instrument. Xicom."],
    competencies: [c("Handling conflict", "التعامل مع الخلافات")],
    usedIn: ["pharmacist_conflict", "character-engine"],
    criteria: c("Each character has a preferred conflict approach in their profile.", "لكل شخصية أسلوب مفضل في التعامل مع الصراع في ملفها."),
    recommendation: c("Choose the mode on purpose; collaborate when the relationship and the issue both matter.", "اختر الأسلوب عن قصد، وتعاون عندما تكون العلاقة والقضية مهمتين معًا."),
  },
  {
    id: "team-conflict",
    name: c("Task and relationship conflict in teams", "صراع المهام وصراع العلاقات في الفرق"),
    kind: "research",
    evidence: "strong",
    summary: c("Both task and relationship conflict are linked to lower team performance and satisfaction; relationship conflict especially harms satisfaction.", "صراع المهام وصراع العلاقات كلاهما مرتبط بانخفاض أداء الفريق ورضاه، وصراع العلاقات يضر الرضا بشكل خاص."),
    sources: ["De Dreu, C. K. W., & Weingart, L. R. (2003). Task versus relationship conflict, team performance, and team member satisfaction: A meta-analysis. Journal of Applied Psychology, 88(4), 741–749."],
    competencies: [c("Handling conflict", "التعامل مع الخلافات"), c("Team building", "بناء الفريق")],
    usedIn: ["pharmacist_conflict"],
    criteria: c("Ignoring a conflict between two pharmacists damages their relationship (−8) and customer satisfaction; resolving it improves the relationship.", "تجاهل خلاف بين صيدليين يضر علاقتهما (−8) ورضا العملاء، وحلّه يحسّن العلاقة."),
    recommendation: c("Deal with conflict early, before it becomes personal.", "تعامل مع الخلاف مبكرًا، قبل أن يصبح شخصيًا."),
  },
  {
    id: "psychological-safety",
    name: c("Psychological safety", "الأمان النفسي"),
    kind: "research",
    evidence: "strong",
    summary: c("Teams learn when members believe they can speak up about errors without being punished.", "تتعلم الفرق عندما يؤمن أعضاؤها أنهم يستطيعون الحديث عن الأخطاء دون عقاب."),
    sources: ["Edmondson, A. (1999). Psychological safety and learning behavior in work teams. Administrative Science Quarterly, 44(2), 350–383."],
    competencies: [c("Speaking-up culture", "ثقافة المصارحة"), c("Patient safety", "سلامة المرضى")],
    usedIn: ["dispensing_near_miss", "hidden_incident_found"],
    criteria: c("A blame-free review of a near miss raises trust; a formal warning lowers it sharply (−8); hiding it leads to a later incident that is found by others.", "المراجعة دون لوم لخطأ وشيك ترفع الثقة، والإنذار الرسمي يخفضها بشدة (−8)، وإخفاؤه يؤدي لاحقًا إلى حادثة يكتشفها آخرون."),
    recommendation: c("Thank people for reporting errors; fix the system first.", "اشكر من يبلّغ عن الأخطاء، وأصلح النظام أولًا."),
  },
  {
    id: "empowerment",
    name: c("Psychological empowerment", "التمكين النفسي"),
    kind: "research",
    evidence: "strong",
    summary: c("Empowerment (meaning, competence, self-determination, impact) is linked to performance, satisfaction and commitment.", "التمكين (المعنى، الكفاءة، تقرير المصير، الأثر) مرتبط بالأداء والرضا والالتزام."),
    sources: ["Seibert, S. E., Wang, G., & Courtright, S. H. (2011). Antecedents and consequences of psychological and team empowerment in organizations: A meta-analytic review. Journal of Applied Psychology, 96(5), 981–1003."],
    competencies: [c("Delegation", "التفويض"), c("Empowering", "التمكين")],
    usedIn: ["refuses_responsibility", "roster_approval", "character-engine"],
    criteria: c("Delegating to a capable person (S4 with D4) increases commitment; delegating to someone still learning lowers it.", "التفويض لشخص كفء (S4 مع D4) يزيد الالتزام، والتفويض لمن ما زال يتعلم يخفضه."),
    recommendation: c("Delegate outcomes, not just tasks, to people who are ready.", "فوّض النتائج، وليس المهام فقط، لمن هم مستعدون."),
  },
  {
    id: "management-functions",
    name: c("Management functions (plan, organise, lead, control)", "وظائف الإدارة (التخطيط، التنظيم، القيادة، الرقابة)"),
    kind: "framework",
    evidence: "moderate",
    summary: c("Classic description of managerial work, later grouped as planning, organising, leading and controlling.", "الوصف الكلاسيكي للعمل الإداري، جُمع لاحقًا في التخطيط والتنظيم والقيادة والرقابة."),
    sources: ["Fayol, H. (1949). General and Industrial Management (C. Storrs, Trans.). Pitman. (Original work published 1916)"],
    competencies: [c("Planning", "التخطيط"), c("Control", "الرقابة")],
    usedIn: ["roster_approval", "branch_visit", "stockout"],
    criteria: c("Routine situations (rosters, visits, stock) are part of the day loop, not only crises.", "المواقف الروتينية (الجداول، الزيارات، المخزون) جزء من يوم العمل، وليست الأزمات فقط."),
    recommendation: c("Protect time for routine planning and checks; most problems start there.", "خصص وقتًا للتخطيط والمراجعات الروتينية، فمعظم المشاكل تبدأ هناك."),
  },
  {
    id: "decision-making",
    name: c("Decision making: biases and participation", "اتخاذ القرار: التحيزات والمشاركة"),
    kind: "research",
    evidence: "moderate",
    summary: c(
      "Fast intuitive judgement is prone to predictable biases; leaders should choose how much to involve others depending on the decision.",
      "الحكم الحدسي السريع معرض لتحيزات متوقعة، وعلى القائد أن يختار مقدار إشراك الآخرين حسب طبيعة القرار.",
    ),
    sources: [
      "Kahneman, D. (2011). Thinking, Fast and Slow. Farrar, Straus and Giroux.",
      "Vroom, V. H., & Yetton, P. W. (1973). Leadership and Decision-Making. University of Pittsburgh Press.",
    ],
    competencies: [c("Decision making", "اتخاذ القرار")],
    usedIn: ["end-of-day-report", "ops_challenges_decision"],
    criteria: c("The end-of-day report shows the reasoning behind each consequence, so the player can reflect after acting.", "يوضح تقرير نهاية اليوم المنطق وراء كل نتيجة، ليتأمل اللاعب بعد التصرف."),
    recommendation: c("Slow down on high-stakes calls and involve the people who must carry them out.", "تمهّل في القرارات المهمة وأشرك من سينفذونها."),
  },
  {
    id: "leading-change",
    name: c("Leading change (eight steps)", "قيادة التغيير (ثماني خطوات)"),
    kind: "framework",
    evidence: "limited",
    summary: c("Create urgency, build a coalition, form a vision, communicate it, remove obstacles, create short-term wins, build on change and anchor it in culture.", "خلق الإحساس بالإلحاح، وبناء تحالف، وصياغة رؤية، وإيصالها، وإزالة العوائق، وتحقيق مكاسب سريعة، والبناء على التغيير، وترسيخه في الثقافة."),
    sources: ["Kotter, J. P. (1996). Leading Change. Harvard Business School Press."],
    competencies: [c("Leading change", "قيادة التغيير")],
    usedIn: ["loyalty_campaign"],
    criteria: c("Planned for a later sprint (multi-week change initiatives).", "مخطط لمرحلة لاحقة (مبادرات تغيير على عدة أسابيع)."),
    recommendation: c("Show early wins to keep a change moving.", "أظهر مكاسب مبكرة للحفاظ على زخم التغيير."),
    caution: c("Widely used, but based mainly on practice rather than controlled research.", "واسع الاستخدام، لكنه قائم أساسًا على الممارسة لا على أبحاث مضبوطة."),
  },
  {
    id: "trust",
    name: c("Organisational trust (ability, benevolence, integrity)", "الثقة التنظيمية (القدرة، حسن النية، النزاهة)"),
    kind: "research",
    evidence: "strong",
    summary: c("Trust is the willingness to be vulnerable to another person, based on their perceived ability, benevolence and integrity.", "الثقة هي الاستعداد لتقبّل المخاطرة مع شخص آخر، بناءً على ما يُدرَك من قدرته وحسن نيته ونزاهته."),
    sources: ["Mayer, R. C., Davis, J. H., & Schoorman, F. D. (1995). An integrative model of organizational trust. Academy of Management Review, 20(3), 709–734."],
    competencies: [c("Building trust", "بناء الثقة")],
    usedIn: ["character-engine", "audit_gap", "khalid_poach"],
    criteria: c(
      "Every character holds a trust score towards you (−100..100). It changes only through recorded decisions and reactions, and it scales the effect of people-led options (×1.25 at 65+, ×0.75 below 35).",
      "تحمل كل شخصية درجة ثقة فيك (−100 إلى 100). لا تتغير إلا من خلال القرارات وردود الفعل المسجلة، وتضاعف أثر الخيارات المعتمدة على الناس (×1.25 عند 65+، و×0.75 تحت 35).",
    ),
    recommendation: c("Keep promises and be consistent; trust is built slowly and lost quickly.", "أوفِ بوعودك وكن ثابتًا، فالثقة تُبنى ببطء وتُفقد بسرعة."),
  },
];
