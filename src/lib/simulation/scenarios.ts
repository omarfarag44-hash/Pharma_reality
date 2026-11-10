/**
 * Scenario catalogue: every situation the Area Supervisor can face, written as data.
 *
 * Units for metric effects:
 * - sales:  % change of the branch's sales (and transactions)
 * - stock, compliance, csat: points on a 0–100 scale
 * - expiry, slow: % change of the near-expiry / slow-moving stock value
 *
 * `code` and the option order are saved in the player's progress. Never renumber
 * a template or reorder its options; add new ones at the end.
 */
import type { ScenarioTemplate } from "./types";
import { LEADERSHIP_SCENARIOS } from "./scenarios-leadership";

const CORE_SCENARIOS: ScenarioTemplate[] = [
  {
    code: 1,
    key: "first_priorities",
    category: "stakeholder",
    severity: "medium",
    title: { en: "Your first 90 days", ar: "أول 90 يومًا لك" },
    narrative: {
      en: "{ops} calls on your first morning: \"I want to hear your priority for the region before Thursday's review. One priority, not five.\"",
      ar: "يتصل بك {ops} في صباحك الأول: «أريد أن أسمع أولويتك للمنطقة قبل مراجعة الخميس. أولوية واحدة، لا خمس.»",
    },
    branch: "none",
    people: ["ops"],
    weight: 0,
    fixedDay: 1,
    once: true,
    options: [
      {
        label: { en: "Close the sales gap in the weakest branches", ar: "سدّ فجوة المبيعات في الفروع الأضعف" },
        outcome: { en: "{ops} nods: \"Numbers first. I'll hold you to it.\" Branch Leaders hear the message: targets matter.", ar: "يومئ {ops}: «الأرقام أولًا. سأحاسبك على ذلك.» ووصلت الرسالة لقادة الفروع: الأهداف مهمة." },
        dna: { results: 3, decisiveness: 1 },
        effects: [
          { kind: "trust", who: "ops", delta: 6 },
          { kind: "metric", scope: "area", field: "sales", delta: 0.4 },
          { kind: "memory", who: "ops", type: "commitment", text: { en: "Promised to close the sales gap in the weakest branches.", ar: "وعد بسدّ فجوة المبيعات في الفروع الأضعف." }, salience: 70 },
          { kind: "flag", flag: "priority_results" },
        ],
      },
      {
        label: { en: "Visit every Branch Leader in the first two weeks", ar: "زيارة كل قادة الفروع في أول أسبوعين" },
        outcome: { en: "{ops} is unconvinced: \"Visits are not a strategy.\" But the Branch Leaders notice you are listening.", ar: "{ops} غير مقتنع: «الزيارات ليست استراتيجية.» لكن قادة الفروع لاحظوا أنك تستمع." },
        dna: { people: 3, collaboration: 1 },
        effects: [
          { kind: "trust", who: "ops", delta: -2 },
          { kind: "metric", scope: "area", field: "csat", delta: 0.3 },
          { kind: "memory", who: "ops", type: "commitment", text: { en: "Chose people first: visits to every Branch Leader.", ar: "اختار الناس أولًا: زيارة كل قادة الفروع." }, salience: 55 },
          { kind: "flag", flag: "priority_people" },
        ],
      },
      {
        label: { en: "Fix compliance and expiry before anything else", ar: "إصلاح الالتزام والصلاحية قبل أي شيء" },
        outcome: { en: "{ops}: \"Sensible. Audits embarrassed us last quarter.\" Branches start cleaning up their expiry shelves.", ar: "{ops}: «منطقي. التدقيق أحرجنا الربع الماضي.» وبدأت الفروع بتنظيف رفوف الأدوية قريبة الانتهاء." },
        dna: { integrity: 3, decisiveness: 1 },
        effects: [
          { kind: "trust", who: "ops", delta: 3 },
          { kind: "metric", scope: "area", field: "compliance", delta: 0.6 },
          { kind: "metric", scope: "area", field: "expiry", delta: -4 },
          { kind: "memory", who: "ops", type: "commitment", text: { en: "Put compliance and expiry control first.", ar: "جعل الالتزام وضبط الصلاحية أولًا." }, salience: 60 },
          { kind: "flag", flag: "priority_compliance" },
        ],
      },
    ],
    ignored: {
      outcome: { en: "You never answered. {ops} notes it in his diary: \"No clear priority.\"", ar: "لم تُجب. دوّن {ops} في مذكرته: «لا توجد أولوية واضحة.»" },
      dna: { decisiveness: -2 },
      effects: [
        { kind: "trust", who: "ops", delta: -8 },
        { kind: "memory", who: "ops", type: "grievance", text: { en: "Did not give a priority when asked on day one.", ar: "لم يحدد أولوية عندما طُلب منه في اليوم الأول." }, salience: 65 },
      ],
    },
  },
  {
    code: 2,
    key: "stockout",
    category: "inventory",
    severity: "high",
    title: { en: "Chronic medicine out of stock", ar: "نفاد دواء مزمن" },
    narrative: {
      en: "{leader} at {branch} reports that a high-demand diabetes medicine has run out. Regular patients are being turned away and the next delivery is four days away.",
      ar: "يبلغك {leader} في {branch} بنفاد دواء سكري عالي الطلب. المرضى المنتظمون يُعادون دون دواء، والتوريد القادم بعد أربعة أيام.",
    },
    branch: "lowestStock",
    people: ["leader", "SCM", "noura"],
    weight: 5,
    cooldown: 5,
    options: [
      {
        label: { en: "Emergency transfer from a sister branch", ar: "تحويل عاجل من فرع شقيق" },
        outcome: { en: "Stock arrives the same evening. The sister branch grumbles, but patients are served.", ar: "وصل المخزون في المساء نفسه. تذمّر الفرع الشقيق، لكن المرضى حصلوا على أدويتهم." },
        dna: { decisiveness: 2, customer: 2 },
        effects: [
          { kind: "metric", scope: "branch", field: "stock", delta: 3 },
          { kind: "metric", scope: "branch", field: "sales", delta: 0.5 },
          { kind: "trust", who: "leader", delta: 4 },
        ],
      },
      {
        label: { en: "Escalate to Supply Chain and fix the root cause", ar: "التصعيد لسلسلة الإمداد ومعالجة السبب الجذري" },
        outcome: { en: "{SCM} raises the branch's reorder point. Slower relief today, fewer stock-outs next month.", ar: "رفع {SCM} حدّ إعادة الطلب للفرع. الحل اليوم أبطأ، لكن حالات النفاد ستقل الشهر القادم." },
        dna: { collaboration: 2, integrity: 1 },
        effects: [
          { kind: "metric", scope: "branch", field: "stock", delta: 2 },
          { kind: "trust", who: "SCM", delta: 6 },
          { kind: "memory", who: "SCM", type: "recognition", text: { en: "Came to us with the root cause, not just a complaint.", ar: "جاءنا بالسبب الجذري لا بشكوى فقط." }, salience: 50 },
        ],
      },
      {
        label: { en: "Ask Noura for a cross-region transfer", ar: "طلب تحويل من منطقة نورة" },
        outcome: { en: "{noura} sends the stock within hours: \"Happy to help. You'll return the favour one day.\"", ar: "أرسلت {noura} المخزون خلال ساعات: «يسعدني المساعدة. سترد الجميل يومًا ما.»" },
        dna: { collaboration: 3, customer: 1 },
        effects: [
          { kind: "metric", scope: "branch", field: "stock", delta: 3.5 },
          { kind: "metric", scope: "branch", field: "sales", delta: 0.4 },
          { kind: "trust", who: "noura", delta: 2 },
          { kind: "memory", who: "noura", type: "commitment", text: { en: "Sent stock to their region; they owe a transfer back.", ar: "أرسلت مخزونًا لمنطقته؛ وعليه تحويل مقابل." }, salience: 75 },
          { kind: "flag", flag: "owes_noura" },
        ],
      },
    ],
    ignored: {
      outcome: { en: "Nobody acted. Patients went to a competitor and {leader} felt left alone.", ar: "لم يتصرف أحد. ذهب المرضى إلى منافس، وشعر {leader} أنه وحيد." },
      effects: [
        { kind: "metric", scope: "branch", field: "stock", delta: -2 },
        { kind: "metric", scope: "branch", field: "csat", delta: -2 },
        { kind: "metric", scope: "branch", field: "sales", delta: -0.6 },
        { kind: "trust", who: "leader", delta: -5 },
        { kind: "memory", who: "leader", type: "grievance", text: { en: "Asked for help with a stock-out and got none.", ar: "طلب المساعدة في نفاد مخزون ولم يتلقها." }, salience: 60 },
      ],
    },
  },
  {
    code: 3,
    key: "near_expiry",
    category: "inventory",
    severity: "medium",
    title: { en: "Near-expiry stock piling up", ar: "تراكم مخزون قريب الانتهاء" },
    narrative: {
      en: "The monthly report shows {branch} holding the most stock that expires within 90 days. {leader} asks what to do before it becomes a write-off.",
      ar: "يُظهر التقرير الشهري أن {branch} يحمل أكبر مخزون ينتهي خلال 90 يومًا. يسألك {leader} عما يجب فعله قبل أن يتحول إلى شطب.",
    },
    branch: "highestExpiry",
    people: ["leader", "PUR"],
    weight: 4,
    cooldown: 6,
    options: [
      {
        label: { en: "Run an in-store markdown", ar: "تخفيض سعر داخل الفرع" },
        outcome: { en: "Customers like the deal; most of the stock moves at a lower margin.", ar: "أعجب العملاء العرض؛ وتحرك معظم المخزون بهامش أقل." },
        dna: { results: 1, customer: 1, decisiveness: 1 },
        effects: [
          { kind: "metric", scope: "branch", field: "expiry", delta: -25 },
          { kind: "metric", scope: "branch", field: "sales", delta: 0.3 },
          { kind: "metric", scope: "branch", field: "csat", delta: 0.5 },
        ],
      },
      {
        label: { en: "Return it to the vendor through Purchasing", ar: "إرجاعه للمورد عبر المشتريات" },
        outcome: { en: "{PUR} negotiates a return. Paperwork is slow, but the value is protected.", ar: "تفاوض {PUR} على الإرجاع. الأوراق بطيئة لكن القيمة محمية." },
        dna: { integrity: 2, collaboration: 1 },
        effects: [
          { kind: "metric", scope: "branch", field: "expiry", delta: -18 },
          { kind: "trust", who: "PUR", delta: 5 },
        ],
      },
      {
        label: { en: "Coach the leader to rebalance it across branches", ar: "توجيه القائد لتوزيعه على الفروع" },
        outcome: { en: "{leader} builds the transfer plan on their own and learns how to read the expiry report.", ar: "أعدّ {leader} خطة التحويل بنفسه وتعلم قراءة تقرير الصلاحية." },
        dna: { people: 2, collaboration: 1 },
        trustScaled: "leader",
        effects: [
          { kind: "metric", scope: "branch", field: "expiry", delta: -20 },
          { kind: "metric", scope: "branch", field: "slow", delta: -5 },
          { kind: "trust", who: "leader", delta: 4 },
          { kind: "memory", who: "leader", type: "interaction", text: { en: "Was coached through the expiry report instead of being told what to do.", ar: "تلقى توجيهًا لقراءة تقرير الصلاحية بدل الأوامر المباشرة." }, salience: 45 },
        ],
      },
    ],
    ignored: {
      outcome: { en: "The stock kept ageing. Finance will write part of it off.", ar: "استمر المخزون في التقادم. ستشطب المالية جزءًا منه." },
      effects: [
        { kind: "metric", scope: "branch", field: "expiry", delta: 15 },
        { kind: "metric", scope: "branch", field: "compliance", delta: -1 },
      ],
    },
  },
  {
    code: 4,
    key: "late_pharmacist",
    category: "people",
    severity: "medium",
    title: { en: "Repeated late arrivals", ar: "تأخر متكرر عن الدوام" },
    narrative: {
      en: "{leader} tells you {staff} has been late four times this month. \"The team is watching how we handle it.\"",
      ar: "يخبرك {leader} أن {staff} تأخر أربع مرات هذا الشهر. «الفريق يراقب كيف سنتعامل مع الأمر.»",
    },
    branch: "random",
    staff: "random",
    people: ["leader", "staff"],
    weight: 3,
    cooldown: 7,
    minDay: 2,
    options: [
      {
        label: { en: "Formal warning, by the HR policy", ar: "إنذار رسمي حسب سياسة الموارد البشرية" },
        outcome: { en: "{staff} signs the warning in silence. Punctuality improves; warmth does not.", ar: "وقّع {staff} الإنذار بصمت. تحسن الالتزام بالمواعيد، أما الود فلا." },
        dna: { integrity: 2, decisiveness: 2, people: -1 },
        effects: [
          { kind: "metric", scope: "branch", field: "compliance", delta: 1 },
          { kind: "trust", who: "staff", delta: -8 },
          { kind: "trust", who: "leader", delta: 3 },
          { kind: "memory", who: "staff", type: "grievance", text: { en: "Got a formal warning without being asked why.", ar: "تلقى إنذارًا رسميًا دون أن يُسأل عن السبب." }, salience: 70 },
        ],
      },
      {
        label: { en: "Have a private conversation first", ar: "محادثة خاصة أولًا" },
        outcome: { en: "{staff} explains a family situation. You agree on a shift swap; the lateness stops.", ar: "شرح {staff} ظرفًا عائليًا. اتفقتما على تبديل مناوبة، وتوقف التأخر." },
        dna: { people: 3, customer: 0 },
        effects: [
          { kind: "trust", who: "staff", delta: 8 },
          { kind: "trust", who: "leader", delta: 1 },
          { kind: "metric", scope: "branch", field: "csat", delta: 0.5 },
          { kind: "memory", who: "staff", type: "recognition", text: { en: "Listened before judging, and helped with a shift swap.", ar: "استمع قبل أن يحكم، وساعد في تبديل المناوبة." }, salience: 75 },
        ],
      },
      {
        label: { en: "Coach the leader to handle it", ar: "توجيه القائد للتعامل معه بنفسه" },
        outcome: { en: "{leader} runs the conversation with your script. It is clumsy, but it is theirs.", ar: "أدار {leader} المحادثة بخطتك. كانت متعثرة، لكنها كانت محادثته هو." },
        dna: { people: 2, decisiveness: 1 },
        trustScaled: "leader",
        effects: [
          { kind: "trust", who: "leader", delta: 6 },
          { kind: "metric", scope: "branch", field: "compliance", delta: 0.5 },
          { kind: "memory", who: "leader", type: "recognition", text: { en: "Was trusted to handle a team issue on their own.", ar: "حظي بالثقة للتعامل مع مشكلة في فريقه بنفسه." }, salience: 60 },
        ],
      },
    ],
    ignored: {
      outcome: { en: "Nothing was done. Others start arriving late too.", ar: "لم يُتخذ أي إجراء. وبدأ آخرون بالتأخر أيضًا." },
      effects: [
        { kind: "metric", scope: "branch", field: "compliance", delta: -1.5 },
        { kind: "trust", who: "leader", delta: -5 },
        { kind: "memory", who: "leader", type: "grievance", text: { en: "Raised a discipline problem; the supervisor did nothing.", ar: "أثار مشكلة انضباط ولم يفعل المشرف شيئًا." }, salience: 55 },
      ],
    },
  },
  {
    code: 5,
    key: "viral_complaint",
    category: "customer",
    severity: "high",
    title: { en: "Complaint goes viral", ar: "شكوى تنتشر على مواقع التواصل" },
    narrative: {
      en: "A customer's video about a 25-minute wait at {branch} has thousands of views. Marketing is asking for your response.",
      ar: "فيديو لعميل عن انتظار 25 دقيقة في {branch} حصد آلاف المشاهدات. التسويق يطلب ردك.",
    },
    branch: "lowestCsat",
    people: ["leader", "MKT"],
    weight: 3,
    cooldown: 8,
    minDay: 3,
    options: [
      {
        label: { en: "Call the customer and apologise personally", ar: "الاتصال بالعميل والاعتذار شخصيًا" },
        outcome: { en: "The customer posts a follow-up thanking you. Comments turn positive.", ar: "نشر العميل تحديثًا يشكرك فيه. وتحولت التعليقات إلى إيجابية." },
        dna: { customer: 3, decisiveness: 1 },
        effects: [
          { kind: "metric", scope: "branch", field: "csat", delta: 3 },
          { kind: "trust", who: "MKT", delta: 2 },
        ],
      },
      {
        label: { en: "Add a pharmacist at peak hours", ar: "إضافة صيدلي في أوقات الذروة" },
        outcome: { en: "Queues shrink within a week. The root cause is fixed, the video stays online.", ar: "تقلص الطابور خلال أسبوع. عولج السبب الجذري، وبقي الفيديو منشورًا." },
        dna: { results: 1, decisiveness: 2, customer: 1 },
        effects: [
          { kind: "metric", scope: "branch", field: "csat", delta: 2 },
          { kind: "metric", scope: "branch", field: "sales", delta: 0.6 },
          { kind: "trust", who: "leader", delta: 3 },
        ],
      },
      {
        label: { en: "Let Marketing handle the reply", ar: "ترك الرد للتسويق" },
        outcome: { en: "{MKT}'s team posts a polite statement. Correct, but it changes nothing in the branch.", ar: "نشر فريق {MKT} بيانًا مهذبًا. صحيح، لكنه لا يغيّر شيئًا في الفرع." },
        dna: { collaboration: 2, customer: -1 },
        effects: [
          { kind: "metric", scope: "branch", field: "csat", delta: 0.5 },
          { kind: "trust", who: "MKT", delta: 3 },
        ],
      },
    ],
    ignored: {
      outcome: { en: "The silence becomes the story. More negative reviews follow.", ar: "أصبح الصمت هو القصة. وتبعته تقييمات سلبية أكثر." },
      dna: { customer: -2 },
      effects: [
        { kind: "metric", scope: "branch", field: "csat", delta: -3 },
        { kind: "metric", scope: "branch", field: "sales", delta: -0.5 },
        { kind: "trust", who: "MKT", delta: -3 },
      ],
    },
  },
  {
    code: 6,
    key: "audit_gap",
    category: "compliance",
    severity: "high",
    title: { en: "Fridge temperature logs incomplete", ar: "سجلات حرارة الثلاجة ناقصة" },
    narrative: {
      en: "A pre-audit check at {branch} finds two weeks of missing fridge temperature logs. Quality Assurance visits next week.",
      ar: "فحص قبل التدقيق في {branch} وجد أسبوعين من سجلات حرارة الثلاجة مفقودة. الجودة ستزور الفرع الأسبوع القادم.",
    },
    branch: "lowestCompliance",
    people: ["leader", "QAC"],
    weight: 4,
    cooldown: 6,
    options: [
      {
        label: { en: "Run a compliance blitz yourself", ar: "حملة التزام تقودها بنفسك" },
        outcome: { en: "You spend a full day in the branch. Everything is fixed, and {leader} feels watched.", ar: "قضيت يومًا كاملًا في الفرع. أُصلح كل شيء، وشعر {leader} أنه مراقَب." },
        dna: { integrity: 2, decisiveness: 2, people: -1 },
        effects: [
          { kind: "metric", scope: "branch", field: "compliance", delta: 5 },
          { kind: "trust", who: "leader", delta: -3 },
        ],
      },
      {
        label: { en: "Coach the leader to own the corrective plan", ar: "توجيه القائد لامتلاك الخطة التصحيحية" },
        outcome: { en: "{leader} writes the plan and assigns a log owner per shift.", ar: "كتب {leader} الخطة وعيّن مسؤولًا عن السجل في كل مناوبة." },
        dna: { people: 2, integrity: 1 },
        trustScaled: "leader",
        effects: [
          { kind: "metric", scope: "branch", field: "compliance", delta: 3.5 },
          { kind: "trust", who: "leader", delta: 5 },
          { kind: "memory", who: "leader", type: "interaction", text: { en: "Was coached to own the audit corrective plan.", ar: "تلقى توجيهًا ليمتلك خطة التدقيق التصحيحية." }, salience: 50 },
        ],
      },
      {
        label: { en: "Ask Quality Assurance for a pre-audit visit", ar: "طلب زيارة تمهيدية من الجودة" },
        outcome: { en: "{QAC} sends a specialist who trains the whole team on the logs.", ar: "أرسل {QAC} أخصائيًا درّب الفريق كله على السجلات." },
        dna: { collaboration: 2, integrity: 1 },
        effects: [
          { kind: "metric", scope: "branch", field: "compliance", delta: 4 },
          { kind: "trust", who: "QAC", delta: 5 },
        ],
      },
    ],
    ignored: {
      outcome: { en: "The audit finds the gap. The branch gets a formal finding and {ops} hears about it.", ar: "وجد التدقيق الثغرة. حصل الفرع على ملاحظة رسمية ووصل الخبر إلى {ops}." },
      dna: { integrity: -1 },
      effects: [
        { kind: "metric", scope: "branch", field: "compliance", delta: -4 },
        { kind: "trust", who: "ops", delta: -3 },
      ],
    },
  },
  {
    code: 7,
    key: "khalid_poach",
    category: "stakeholder",
    severity: "high",
    title: { en: "Khalid wants your best pharmacist", ar: "خالد يريد أفضل صيادلتك" },
    narrative: {
      en: "{staff} at {branch} tells you {khalid} offered them a senior role in the Western Region. \"I'd rather stay, if there is a future for me here.\"",
      ar: "يخبرك {staff} في {branch} أن {khalid} عرض عليه منصبًا أعلى في المنطقة الغربية. «أفضّل البقاء إن كان لي مستقبل هنا.»",
    },
    branch: "topAchievement",
    staff: "top",
    people: ["staff", "khalid", "ops"],
    weight: 3,
    minDay: 5,
    once: true,
    options: [
      {
        label: { en: "Build a development plan to keep them", ar: "إعداد خطة تطوير للاحتفاظ به" },
        outcome: { en: "{staff} stays and starts a Branch Leader readiness plan. {khalid} shrugs it off, for now.", ar: "بقي {staff} وبدأ خطة جاهزية لقيادة فرع. تجاهل {khalid} الأمر، حتى الآن." },
        dna: { people: 3, results: 1 },
        effects: [
          { kind: "trust", who: "staff", delta: 10 },
          { kind: "trust", who: "khalid", delta: -3 },
          { kind: "memory", who: "staff", type: "recognition", text: { en: "Was offered a real development plan to stay.", ar: "عُرضت عليه خطة تطوير حقيقية ليبقى." }, salience: 80 },
          { kind: "flag", flag: "kept_talent" },
        ],
      },
      {
        label: { en: "Let them go with your blessing", ar: "تركه يذهب مع تمنياتك" },
        outcome: { en: "{staff} moves west. {khalid} is surprised by your grace and says so to {ops}.", ar: "انتقل {staff} غربًا. فوجئ {khalid} بأسلوبك وقال ذلك لـ{ops}." },
        dna: { collaboration: 3, results: -1 },
        effects: [
          { kind: "trust", who: "khalid", delta: 8 },
          { kind: "trust", who: "staff", delta: 4 },
          { kind: "metric", scope: "branch", field: "sales", delta: -0.8 },
          { kind: "metric", scope: "branch", field: "csat", delta: -1 },
          { kind: "memory", who: "khalid", type: "observation", text: { en: "Did not fight over a pharmacist; let them go gracefully.", ar: "لم يتصارع على صيدلي، وتركه يذهب بلباقة." }, salience: 60 },
        ],
      },
      {
        label: { en: "Complain to the Operations Director", ar: "الشكوى لمدير العمليات" },
        outcome: { en: "{ops} tells {khalid} to stop. {khalid} complies, and will remember.", ar: "طلب {ops} من {khalid} التوقف. امتثل {khalid}، وسيتذكر ذلك." },
        dna: { decisiveness: 2, collaboration: -2 },
        effects: [
          { kind: "trust", who: "khalid", delta: -12 },
          { kind: "trust", who: "ops", delta: -1 },
          { kind: "trust", who: "staff", delta: 2 },
          { kind: "memory", who: "khalid", type: "grievance", text: { en: "Went over my head to the Operations Director.", ar: "تجاوزني واشتكى لمدير العمليات." }, salience: 85 },
          { kind: "flag", flag: "escalated_khalid" },
        ],
      },
    ],
    ignored: {
      outcome: { en: "With no answer from you, {staff} accepts the offer and leaves.", ar: "دون رد منك، قبل {staff} العرض وغادر." },
      dna: { people: -2 },
      effects: [
        { kind: "metric", scope: "branch", field: "sales", delta: -1 },
        { kind: "metric", scope: "branch", field: "csat", delta: -1.5 },
        { kind: "trust", who: "staff", delta: -10 },
      ],
    },
  },
  {
    code: 8,
    key: "khalid_challenge",
    category: "stakeholder",
    severity: "medium",
    title: { en: "Khalid challenges you in the weekly review", ar: "خالد يتحداك في المراجعة الأسبوعية" },
    narrative: {
      en: "In front of all supervisors, {khalid} questions your region's numbers: \"Some of us deliver instead of complaining.\" {ops} waits for your answer.",
      ar: "أمام كل المشرفين، يشكك {khalid} في أرقام منطقتك: «بعضنا يحقق النتائج بدل الشكوى.» و{ops} ينتظر ردك.",
    },
    branch: "none",
    people: ["khalid", "ops"],
    weight: 6,
    once: true,
    requires: { flag: "escalated_khalid", afterDays: 4 },
    options: [
      {
        label: { en: "Answer calmly with your data", ar: "الرد بهدوء بالأرقام" },
        outcome: { en: "Your recovery numbers speak. {ops} cuts the debate short: \"Move on.\"", ar: "تحدثت أرقام التعافي عنك. أنهى {ops} النقاش: «لننتقل.»" },
        dna: { results: 2, integrity: 1 },
        effects: [{ kind: "trust", who: "ops", delta: 4 }],
      },
      {
        label: { en: "Offer Khalid a joint best-practice session", ar: "عرض جلسة مشتركة لأفضل الممارسات على خالد" },
        outcome: { en: "The room relaxes. {khalid} accepts, a little reluctantly. A truce begins.", ar: "هدأت القاعة. قبل {khalid} بشيء من التردد. وبدأت هدنة." },
        dna: { collaboration: 3, people: 1 },
        effects: [
          { kind: "trust", who: "khalid", delta: 12 },
          { kind: "trust", who: "ops", delta: 2 },
          { kind: "memory", who: "khalid", type: "interaction", text: { en: "Answered a public challenge with an offer to work together.", ar: "رد على تحدٍّ علني بعرض للعمل معًا." }, salience: 70 },
          { kind: "flag", flag: "khalid_truce" },
        ],
      },
      {
        label: { en: "Hit back about his staff turnover", ar: "الرد عليه بمعدل دوران موظفيه" },
        outcome: { en: "It lands, and the room goes cold. {ops} is not impressed with either of you.", ar: "أصابت الملاحظة، وبرد الجو. ولم يُعجب {ops} بأي منكما." },
        dna: { decisiveness: 2, collaboration: -3 },
        effects: [
          { kind: "trust", who: "khalid", delta: -10 },
          { kind: "trust", who: "ops", delta: -3 },
          { kind: "memory", who: "khalid", type: "grievance", text: { en: "Was publicly attacked about staff turnover.", ar: "هوجم علنًا بسبب دوران الموظفين." }, salience: 80 },
        ],
      },
    ],
    ignored: {
      outcome: { en: "Your silence reads as agreement. {ops} wonders if {khalid} is right.", ar: "فُهم صمتك كموافقة. وتساءل {ops} إن كان {khalid} محقًا." },
      effects: [{ kind: "trust", who: "ops", delta: -5 }],
    },
  },
  {
    code: 9,
    key: "noura_favour",
    category: "stakeholder",
    severity: "medium",
    title: { en: "Noura asks for the favour back", ar: "نورة تطلب رد الجميل" },
    narrative: {
      en: "{noura} calls: a supplier failed her region and she needs stock from {branch}. Sending it would stretch your branch for a week.",
      ar: "تتصل {noura}: خذلها مورد في منطقتها وتحتاج مخزونًا من {branch}. إرساله سيضغط على فرعك لمدة أسبوع.",
    },
    branch: "topAchievement",
    people: ["noura", "leader"],
    weight: 6,
    once: true,
    requires: { flag: "owes_noura", afterDays: 5 },
    options: [
      {
        label: { en: "Send everything she asked for", ar: "إرسال كل ما طلبته" },
        outcome: { en: "{noura}: \"I knew I could count on you.\" Your branch runs tight for a few days.", ar: "{noura}: «كنت أعلم أنني أستطيع الاعتماد عليك.» وعمل فرعك بضغط لبضعة أيام." },
        dna: { collaboration: 3, integrity: 1 },
        effects: [
          { kind: "trust", who: "noura", delta: 10 },
          { kind: "metric", scope: "branch", field: "stock", delta: -1.5 },
          { kind: "memory", who: "noura", type: "recognition", text: { en: "Kept their word on the stock transfer.", ar: "وفى بوعده في تحويل المخزون." }, salience: 80 },
        ],
      },
      {
        label: { en: "Send half and explain why", ar: "إرسال النصف مع شرح السبب" },
        outcome: { en: "{noura} understands, mostly. The friendship holds.", ar: "تفهمت {noura} في الغالب. وصمدت العلاقة." },
        dna: { collaboration: 1, results: 1 },
        effects: [
          { kind: "trust", who: "noura", delta: 3 },
          { kind: "metric", scope: "branch", field: "stock", delta: -0.5 },
        ],
      },
      {
        label: { en: "Decline: your branches come first", ar: "الاعتذار: فروعك أولًا" },
        outcome: { en: "{noura} is quiet on the phone. \"I see.\" She will think twice next time.", ar: "صمتت {noura} على الهاتف. «فهمت.» وستفكر مرتين في المرة القادمة." },
        dna: { results: 2, collaboration: -3 },
        effects: [
          { kind: "trust", who: "noura", delta: -12 },
          { kind: "memory", who: "noura", type: "grievance", text: { en: "Did not return the stock favour.", ar: "لم يرد جميل المخزون." }, salience: 85 },
        ],
      },
    ],
    ignored: {
      outcome: { en: "You never called back. {noura} found the stock elsewhere and noted who did not help.", ar: "لم تعاود الاتصال. وجدت {noura} المخزون في مكان آخر ولاحظت من لم يساعد." },
      effects: [
        { kind: "trust", who: "noura", delta: -8 },
        { kind: "memory", who: "noura", type: "grievance", text: { en: "Ignored a request for the promised transfer.", ar: "تجاهل طلب التحويل الموعود." }, salience: 70 },
      ],
    },
  },
  {
    code: 10,
    key: "faisal_help",
    category: "stakeholder",
    severity: "low",
    title: { en: "Faisal asks for your help", ar: "فيصل يطلب مساعدتك" },
    narrative: {
      en: "{faisal} is preparing for a tough review with {ops}. He asks if you can help him analyse his region's slow-moving stock.",
      ar: "يستعد {faisal} لمراجعة صعبة مع {ops}. ويسألك إن كنت تستطيع مساعدته في تحليل المخزون بطيء الحركة في منطقته.",
    },
    branch: "none",
    people: ["faisal"],
    weight: 3,
    minDay: 8,
    cooldown: 20,
    options: [
      {
        label: { en: "Spend an afternoon working through it with him", ar: "قضاء ظهيرة كاملة معه في التحليل" },
        outcome: { en: "{faisal}'s review goes well and he tells everyone who helped. Your own branches got less attention that day.", ar: "نجحت مراجعة {faisal} وأخبر الجميع بمن ساعده. لكن فروعك حظيت باهتمام أقل ذلك اليوم." },
        dna: { collaboration: 3, people: 1, results: -1 },
        effects: [
          { kind: "trust", who: "faisal", delta: 10 },
          { kind: "metric", scope: "area", field: "sales", delta: -0.1 },
          { kind: "memory", who: "faisal", type: "recognition", text: { en: "Gave up an afternoon to help before my review.", ar: "ضحى بظهيرة كاملة لمساعدتي قبل مراجعتي." }, salience: 75 },
        ],
      },
      {
        label: { en: "Share your dashboard template", ar: "مشاركة نموذج لوحتك" },
        outcome: { en: "{faisal} adapts it overnight. Helpful, and it cost you ten minutes.", ar: "عدّله {faisal} خلال الليل. مفيد، وكلّفك عشر دقائق." },
        dna: { collaboration: 2 },
        effects: [{ kind: "trust", who: "faisal", delta: 5 }],
      },
      {
        label: { en: "Decline politely, your region needs you", ar: "الاعتذار بلطف، منطقتك تحتاجك" },
        outcome: { en: "{faisal} says he understands. He asks Khalid next time.", ar: "قال {faisal} إنه يتفهم. وفي المرة القادمة سأل خالد." },
        dna: { results: 2, collaboration: -2 },
        effects: [
          { kind: "trust", who: "faisal", delta: -5 },
          { kind: "metric", scope: "area", field: "sales", delta: 0.1 },
        ],
      },
    ],
    ignored: {
      outcome: { en: "{faisal} waited for an answer that never came.", ar: "انتظر {faisal} ردًا لم يأتِ." },
      effects: [{ kind: "trust", who: "faisal", delta: -6 }],
    },
  },
  {
    code: 11,
    key: "loyalty_campaign",
    category: "customer",
    severity: "low",
    title: { en: "Marketing proposes a loyalty campaign", ar: "التسويق يقترح حملة ولاء" },
    narrative: {
      en: "{MKT} wants to launch a double-points loyalty campaign at {branch}, your branch furthest from target.",
      ar: "يريد {MKT} إطلاق حملة نقاط ولاء مضاعفة في {branch}، أبعد فروعك عن الهدف.",
    },
    branch: "lowestAchievement",
    people: ["MKT", "leader"],
    weight: 3,
    cooldown: 10,
    minDay: 4,
    options: [
      {
        label: { en: "Approve the full roll-out", ar: "الموافقة على الإطلاق الكامل" },
        outcome: { en: "Footfall rises. The team is stretched, but sales move.", ar: "زاد عدد الزوار. الفريق تحت ضغط، لكن المبيعات تتحرك." },
        dna: { results: 2, decisiveness: 1 },
        effects: [
          { kind: "metric", scope: "branch", field: "sales", delta: 1.5 },
          { kind: "metric", scope: "branch", field: "csat", delta: 0.5 },
          { kind: "trust", who: "MKT", delta: 4 },
        ],
      },
      {
        label: { en: "Pilot it for two weeks and measure", ar: "تجربتها أسبوعين وقياس النتائج" },
        outcome: { en: "A smaller lift, but now you know what works.", ar: "ارتفاع أصغر، لكنك الآن تعرف ما الذي ينجح." },
        dna: { results: 1, integrity: 1, collaboration: 1 },
        effects: [
          { kind: "metric", scope: "branch", field: "sales", delta: 0.8 },
          { kind: "trust", who: "MKT", delta: 2 },
        ],
      },
      {
        label: { en: "Decline: fix stock and service first", ar: "الرفض: إصلاح المخزون والخدمة أولًا" },
        outcome: { en: "{MKT} is disappointed. The branch spends the week on its basics.", ar: "خاب أمل {MKT}. وقضى الفرع الأسبوع في الأساسيات." },
        dna: { decisiveness: 2, customer: 1 },
        effects: [
          { kind: "metric", scope: "branch", field: "stock", delta: 1 },
          { kind: "metric", scope: "branch", field: "csat", delta: 0.5 },
          { kind: "trust", who: "MKT", delta: -4 },
        ],
      },
    ],
    ignored: {
      outcome: { en: "Marketing moved the budget to another region.", ar: "نقل التسويق الميزانية إلى منطقة أخرى." },
      effects: [{ kind: "trust", who: "MKT", delta: -2 }],
    },
  },
  {
    code: 12,
    key: "dispensing_near_miss",
    category: "compliance",
    severity: "critical",
    title: { en: "Dispensing near-miss", ar: "خطأ صرف كاد أن يقع" },
    narrative: {
      en: "At {branch}, {staff} nearly dispensed the wrong strength of a blood thinner. A colleague caught it at the counter. Nobody was harmed.",
      ar: "في {branch}، كاد {staff} أن يصرف تركيزًا خاطئًا لمميّع دم. اكتشفه زميل عند الكاونتر. ولم يتضرر أحد.",
    },
    branch: "random",
    staff: "random",
    people: ["staff", "leader", "QAC"],
    weight: 2,
    cooldown: 15,
    minDay: 6,
    options: [
      {
        label: { en: "Blame-free review and retraining", ar: "مراجعة دون لوم وإعادة تدريب" },
        outcome: { en: "The team reports two more near-misses they had hidden. Processes get safer.", ar: "أبلغ الفريق عن حالتين أخريين كانتا مخفيتين. وأصبحت الإجراءات أكثر أمانًا." },
        dna: { integrity: 2, people: 2 },
        effects: [
          { kind: "metric", scope: "branch", field: "compliance", delta: 3 },
          { kind: "trust", who: "staff", delta: 5 },
          { kind: "trust", who: "QAC", delta: 3 },
          { kind: "memory", who: "staff", type: "recognition", text: { en: "Was supported, not blamed, after a near-miss.", ar: "حظي بالدعم لا باللوم بعد خطأ كاد أن يقع." }, salience: 75 },
        ],
      },
      {
        label: { en: "Formal investigation and warning", ar: "تحقيق رسمي وإنذار" },
        outcome: { en: "The rules are clear to everyone now. So is the fear of reporting.", ar: "أصبحت القواعد واضحة للجميع الآن. وكذلك الخوف من الإبلاغ." },
        dna: { integrity: 2, decisiveness: 2, people: -2 },
        effects: [
          { kind: "metric", scope: "branch", field: "compliance", delta: 2 },
          { kind: "trust", who: "staff", delta: -8 },
          { kind: "memory", who: "staff", type: "grievance", text: { en: "Was formally investigated for a near-miss nobody was hurt by.", ar: "خضع لتحقيق رسمي بسبب خطأ لم يتضرر منه أحد." }, salience: 75 },
        ],
      },
      {
        label: { en: "Keep it inside the branch, no report", ar: "إبقاؤه داخل الفرع دون بلاغ" },
        outcome: { en: "{staff} is relieved. No report was filed.", ar: "ارتاح {staff}. ولم يُرفع أي بلاغ." },
        dna: { integrity: -4, people: 1 },
        effects: [
          { kind: "trust", who: "staff", delta: 3 },
          { kind: "metric", scope: "branch", field: "compliance", delta: -2 },
          { kind: "flag", flag: "hidden_incident" },
        ],
      },
    ],
    ignored: {
      outcome: { en: "Nobody followed up. The same mistake can happen again.", ar: "لم يتابع أحد. ويمكن أن يتكرر الخطأ نفسه." },
      dna: { integrity: -1 },
      effects: [{ kind: "metric", scope: "branch", field: "compliance", delta: -2 }],
    },
  },
  {
    code: 13,
    key: "hidden_incident_found",
    category: "compliance",
    severity: "critical",
    title: { en: "The unreported incident surfaces", ar: "ظهور الحادثة غير المبلغ عنها" },
    narrative: {
      en: "{QAC} found the near-miss you kept inside the branch during a routine audit. {ops} wants an explanation today.",
      ar: "وجد {QAC} الخطأ الذي أبقيته داخل الفرع خلال تدقيق روتيني. ويريد {ops} تفسيرًا اليوم.",
    },
    branch: "none",
    people: ["ops", "QAC"],
    weight: 8,
    once: true,
    requires: { flag: "hidden_incident", afterDays: 3 },
    options: [
      {
        label: { en: "Take full responsibility", ar: "تحمّل المسؤولية كاملة" },
        outcome: { en: "{ops} is angry but respects it: \"Don't do it again.\"", ar: "غضب {ops} لكنه احترم موقفك: «لا تكررها.»" },
        dna: { integrity: 3 },
        effects: [
          { kind: "trust", who: "ops", delta: -3 },
          { kind: "trust", who: "QAC", delta: 3 },
          { kind: "memory", who: "ops", type: "observation", text: { en: "Owned a mistake without excuses.", ar: "اعترف بخطئه دون أعذار." }, salience: 70 },
        ],
      },
      {
        label: { en: "Say the branch leader did not escalate", ar: "القول إن قائد الفرع لم يصعّد" },
        outcome: { en: "{ops} accepts it for now. The story reaches the branches quickly.", ar: "قبل {ops} ذلك مؤقتًا. ووصلت القصة إلى الفروع بسرعة." },
        dna: { integrity: -3, people: -2 },
        effects: [
          { kind: "trust", who: "ops", delta: -1 },
          { kind: "metric", scope: "area", field: "compliance", delta: -0.5 },
        ],
      },
    ],
    ignored: {
      outcome: { en: "You avoided the call. {ops} escalated to HR.", ar: "تجنبت الاتصال. فصعّد {ops} الأمر للموارد البشرية." },
      dna: { integrity: -2 },
      effects: [
        { kind: "trust", who: "ops", delta: -10 },
        { kind: "memory", who: "ops", type: "grievance", text: { en: "Hid an incident and then avoided explaining it.", ar: "أخفى حادثة ثم تهرب من تفسيرها." }, salience: 90 },
      ],
    },
  },
  {
    code: 14,
    key: "staffing_gap",
    category: "operations",
    severity: "medium",
    title: { en: "Sick leave on a peak day", ar: "إجازة مرضية في يوم ذروة" },
    narrative: {
      en: "{leader} calls at 7am: two pharmacists at {branch} are sick and it is payday weekend traffic.",
      ar: "يتصل {leader} في السابعة صباحًا: صيدليان في {branch} مريضان، واليوم يوم ذروة بعد صرف الرواتب.",
    },
    branch: "random",
    people: ["leader"],
    weight: 3,
    cooldown: 6,
    minDay: 3,
    options: [
      {
        label: { en: "Cover the shift yourself", ar: "تغطية المناوبة بنفسك" },
        outcome: { en: "You work the counter all day. The team will talk about it for weeks.", ar: "عملت عند الكاونتر طوال اليوم. وسيتحدث الفريق عن ذلك لأسابيع." },
        dna: { people: 1, customer: 2, decisiveness: 1 },
        effects: [
          { kind: "metric", scope: "branch", field: "csat", delta: 1 },
          { kind: "metric", scope: "branch", field: "sales", delta: 0.3 },
          { kind: "trust", who: "leader", delta: 6 },
          { kind: "memory", who: "leader", type: "recognition", text: { en: "Came and worked the counter on a peak day.", ar: "جاء وعمل عند الكاونتر في يوم ذروة." }, salience: 70 },
        ],
      },
      {
        label: { en: "Float a pharmacist from a nearby branch", ar: "نقل صيدلي مؤقتًا من فرع قريب" },
        outcome: { en: "Coverage holds in both branches, just about.", ar: "صمدت التغطية في الفرعين، بالكاد." },
        dna: { collaboration: 1, decisiveness: 2 },
        effects: [
          { kind: "metric", scope: "branch", field: "sales", delta: 0.4 },
          { kind: "trust", who: "leader", delta: 2 },
        ],
      },
      {
        label: { en: "Shorten opening hours for the day", ar: "تقليص ساعات العمل لهذا اليوم" },
        outcome: { en: "Customers find the shutters down at peak time.", ar: "وجد العملاء الأبواب مغلقة في وقت الذروة." },
        dna: { results: -1, customer: -2 },
        effects: [
          { kind: "metric", scope: "branch", field: "sales", delta: -0.8 },
          { kind: "metric", scope: "branch", field: "csat", delta: -2 },
        ],
      },
    ],
    ignored: {
      outcome: { en: "The branch ran with one pharmacist. Queues, mistakes, and a tired team.", ar: "عمل الفرع بصيدلي واحد. طوابير وأخطاء وفريق مرهق." },
      effects: [
        { kind: "metric", scope: "branch", field: "sales", delta: -1 },
        { kind: "metric", scope: "branch", field: "csat", delta: -2 },
        { kind: "trust", who: "leader", delta: -4 },
      ],
    },
  },
  {
    code: 15,
    key: "ceo_visit",
    category: "stakeholder",
    severity: "high",
    title: { en: "The CEO wants to visit a branch", ar: "الرئيس التنفيذي يريد زيارة فرع" },
    narrative: {
      en: "{ceo} will visit one of your branches tomorrow and asks you to choose which. {ops} is copied on the email.",
      ar: "سيزور {ceo} أحد فروعك غدًا ويطلب منك اختياره. و{ops} في نسخة البريد.",
    },
    branch: "lowestAchievement",
    people: ["ceo", "ops", "leader"],
    weight: 5,
    minDay: 20,
    once: true,
    options: [
      {
        label: { en: "Show your best branch", ar: "عرض أفضل فروعك" },
        outcome: { en: "A polished visit. {ceo} is pleased, and learns little.", ar: "زيارة مصقولة. سُرّ {ceo}، ولم يتعلم الكثير." },
        dna: { results: 1 },
        effects: [
          { kind: "trust", who: "ops", delta: 3 },
          { kind: "trust", who: "ceo", delta: 2 },
        ],
      },
      {
        label: { en: "Show {branch} with your recovery plan", ar: "عرض {branch} مع خطة التعافي" },
        outcome: { en: "{ceo} spends an hour with {leader} and leaves impressed by the honesty.", ar: "قضى {ceo} ساعة مع {leader} وغادر معجبًا بالصراحة." },
        dna: { integrity: 3, people: 1 },
        effects: [
          { kind: "trust", who: "ceo", delta: 10 },
          { kind: "trust", who: "ops", delta: -2 },
          { kind: "trust", who: "leader", delta: 6 },
          { kind: "memory", who: "ceo", type: "observation", text: { en: "Showed me a struggling branch and a real plan.", ar: "أراني فرعًا متعثرًا وخطة حقيقية." }, salience: 80 },
        ],
      },
      {
        label: { en: "Let the CEO choose at random", ar: "ترك الاختيار للرئيس التنفيذي عشوائيًا" },
        outcome: { en: "{ceo} likes the confidence. The branch he picks is having an average day.", ar: "أعجبت {ceo} الثقة. وكان الفرع الذي اختاره في يوم عادي." },
        dna: { integrity: 1, decisiveness: -1 },
        effects: [{ kind: "trust", who: "ceo", delta: 4 }],
      },
    ],
    ignored: {
      outcome: { en: "{ops} chose for you. He was not happy to.", ar: "اختار {ops} بدلًا منك. ولم يكن سعيدًا بذلك." },
      effects: [{ kind: "trust", who: "ops", delta: -6 }],
    },
  },
  {
    code: 16,
    key: "weekly_review",
    category: "stakeholder",
    severity: "low",
    title: { en: "Thursday performance review", ar: "مراجعة الأداء يوم الخميس" },
    narrative: {
      en: "It is Thursday. {ops} wants the week's area numbers, including the branches that slipped.",
      ar: "اليوم الخميس. يريد {ops} أرقام المنطقة لهذا الأسبوع، بما فيها الفروع التي تراجعت.",
    },
    branch: "none",
    people: ["ops"],
    weight: 0,
    fixedWeekday: 4,
    options: [
      {
        label: { en: "Be transparent, including the bad news and a plan", ar: "الشفافية، مع الأخبار السيئة والخطة" },
        outcome: { en: "{ops} pushes hard on the weak spots, then agrees with your plan.", ar: "ضغط {ops} على نقاط الضعف، ثم وافق على خطتك." },
        dna: { integrity: 2, results: 1 },
        effects: [{ kind: "trust", who: "ops", delta: 3 }],
      },
      {
        label: { en: "Lead with the wins", ar: "البدء بالإنجازات" },
        outcome: { en: "A pleasant meeting. {ops} will find the weak spots in the report anyway.", ar: "اجتماع لطيف. وسيجد {ops} نقاط الضعف في التقرير على أي حال." },
        dna: { results: 1, integrity: -2 },
        effects: [{ kind: "trust", who: "ops", delta: 1 }],
      },
      {
        label: { en: "Ask for extra staffing budget", ar: "طلب ميزانية إضافية للموظفين" },
        outcome: { en: "{ops} says no for now, but asks {HR} to speed up hiring for your region.", ar: "رفض {ops} حاليًا، لكنه طلب من {HR} تسريع التوظيف لمنطقتك." },
        dna: { people: 1, collaboration: 1 },
        effects: [
          { kind: "trust", who: "ops", delta: -1 },
          { kind: "trust", who: "HR", delta: 2 },
          { kind: "metric", scope: "area", field: "csat", delta: 0.2 },
        ],
      },
    ],
    ignored: {
      outcome: { en: "You sent the numbers late, with no comment.", ar: "أرسلت الأرقام متأخرة ودون تعليق." },
      effects: [{ kind: "trust", who: "ops", delta: -4 }],
    },
  },
];

export const SCENARIOS: ScenarioTemplate[] = [...CORE_SCENARIOS, ...LEADERSHIP_SCENARIOS];

export const SCENARIO_BY_CODE = new Map(SCENARIOS.map((s) => [s.code, s]));
