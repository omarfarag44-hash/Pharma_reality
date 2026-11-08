/**
 * Synthetic name pools. Combinations are generated deterministically and are
 * not intended to identify any real person.
 */
import type { Gender, LocalizedText } from "@/domain/common";
import type { Rng } from "./random";

export const MALE_FIRST_NAMES: LocalizedText[] = [
  { en: "Ahmed", ar: "أحمد" },
  { en: "Mohammed", ar: "محمد" },
  { en: "Abdullah", ar: "عبدالله" },
  { en: "Fahad", ar: "فهد" },
  { en: "Saud", ar: "سعود" },
  { en: "Turki", ar: "تركي" },
  { en: "Nasser", ar: "ناصر" },
  { en: "Bandar", ar: "بندر" },
  { en: "Sultan", ar: "سلطان" },
  { en: "Yousef", ar: "يوسف" },
  { en: "Hamad", ar: "حمد" },
  { en: "Ibrahim", ar: "إبراهيم" },
  { en: "Saleh", ar: "صالح" },
  { en: "Mansour", ar: "منصور" },
  { en: "Rakan", ar: "راكان" },
  { en: "Ziyad", ar: "زياد" },
  { en: "Osama", ar: "أسامة" },
  { en: "Hisham", ar: "هشام" },
  { en: "Tariq", ar: "طارق" },
  { en: "Waleed", ar: "وليد" },
  { en: "Anas", ar: "أنس" },
  { en: "Mazen", ar: "مازن" },
  { en: "Hassan", ar: "حسن" },
  { en: "Ali", ar: "علي" },
  { en: "Adel", ar: "عادل" },
  { en: "Badr", ar: "بدر" },
  { en: "Nawaf", ar: "نواف" },
  { en: "Muath", ar: "معاذ" },
  { en: "Yazeed", ar: "يزيد" },
  { en: "Sami", ar: "سامي" },
  { en: "Ammar", ar: "عمار" },
  { en: "Hatem", ar: "حاتم" },
  { en: "Raed", ar: "رائد" },
  { en: "Moayad", ar: "مؤيد" },
];

export const FEMALE_FIRST_NAMES: LocalizedText[] = [
  { en: "Sara", ar: "سارة" },
  { en: "Nouf", ar: "نوف" },
  { en: "Reem", ar: "ريم" },
  { en: "Hessa", ar: "حصة" },
  { en: "Lama", ar: "لمى" },
  { en: "Abeer", ar: "عبير" },
  { en: "Maha", ar: "مها" },
  { en: "Asma", ar: "أسماء" },
  { en: "Rawan", ar: "روان" },
  { en: "Dana", ar: "دانة" },
  { en: "Ghada", ar: "غادة" },
  { en: "Hind", ar: "هند" },
  { en: "Jawaher", ar: "جواهر" },
  { en: "Lujain", ar: "لجين" },
  { en: "Manal", ar: "منال" },
  { en: "Najla", ar: "نجلاء" },
  { en: "Rana", ar: "رنا" },
  { en: "Shahad", ar: "شهد" },
  { en: "Wafa", ar: "وفاء" },
  { en: "Amal", ar: "أمل" },
  { en: "Bayan", ar: "بيان" },
  { en: "Deema", ar: "ديمة" },
  { en: "Haifa", ar: "هيفاء" },
  { en: "Areej", ar: "أريج" },
  { en: "Razan", ar: "رزان" },
  { en: "Mashael", ar: "مشاعل" },
  { en: "Afnan", ar: "أفنان" },
  { en: "Joud", ar: "جود" },
  { en: "Layan", ar: "ليان" },
  { en: "Arwa", ar: "أروى" },
];

export const FAMILY_NAMES: LocalizedText[] = [
  { en: "Al-Harbi", ar: "الحربي" },
  { en: "Al-Otaibi", ar: "العتيبي" },
  { en: "Al-Ghamdi", ar: "الغامدي" },
  { en: "Al-Zahrani", ar: "الزهراني" },
  { en: "Al-Dosari", ar: "الدوسري" },
  { en: "Al-Shammari", ar: "الشمري" },
  { en: "Al-Mutairi", ar: "المطيري" },
  { en: "Al-Anazi", ar: "العنزي" },
  { en: "Al-Subaie", ar: "السبيعي" },
  { en: "Al-Juhani", ar: "الجهني" },
  { en: "Al-Maliki", ar: "المالكي" },
  { en: "Al-Omari", ar: "العمري" },
  { en: "Al-Asmari", ar: "الأسمري" },
  { en: "Al-Rashidi", ar: "الرشيدي" },
  { en: "Al-Balawi", ar: "البلوي" },
  { en: "Al-Tamimi", ar: "التميمي" },
  { en: "Al-Sulami", ar: "السلمي" },
  { en: "Al-Bishi", ar: "البيشي" },
  { en: "Al-Hazmi", ar: "الحازمي" },
  { en: "Al-Faifi", ar: "الفيفي" },
  { en: "Al-Khaldi", ar: "الخالدي" },
  { en: "Al-Saadi", ar: "السعدي" },
  { en: "Al-Nemer", ar: "النمر" },
  { en: "Al-Hamdan", ar: "الحمدان" },
  { en: "Al-Rumaih", ar: "الرميح" },
  { en: "Al-Jaber", ar: "الجابر" },
  { en: "Al-Khamees", ar: "الخميس" },
  { en: "Al-Obaid", ar: "العبيد" },
  { en: "Al-Yami", ar: "اليامي" },
  { en: "Al-Dakheel", ar: "الدخيل" },
  { en: "Al-Mubarak", ar: "المبارك" },
  { en: "Al-Hussaini", ar: "الحسيني" },
  { en: "Al-Saif", ar: "السيف" },
  { en: "Al-Fraih", ar: "الفريح" },
];

/** Hands out unique full names. Names reserved by hand-authored characters are never reused. */
export class NamePicker {
  private used = new Set<string>();

  constructor(reserved: LocalizedText[] = []) {
    reserved.forEach((n) => this.used.add(n.en));
  }

  reserve(name: LocalizedText) {
    if (this.used.has(name.en)) throw new Error(`Duplicate name: ${name.en}`);
    this.used.add(name.en);
  }

  next(rng: Rng, gender: Gender): LocalizedText {
    const firsts = gender === "male" ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
    for (let attempt = 0; attempt < 500; attempt++) {
      const first = rng.pick(firsts);
      const family = rng.pick(FAMILY_NAMES);
      const name = { en: `${first.en} ${family.en}`, ar: `${first.ar} ${family.ar}` };
      // Avoid two people sharing a first name in a row of picks too often is not required,
      // but full names must be unique across the organisation.
      if (!this.used.has(name.en)) {
        this.used.add(name.en);
        return name;
      }
    }
    throw new Error("Name pool exhausted");
  }
}

export function emailFor(name: LocalizedText): string {
  const slug = name.en
    .toLowerCase()
    .replace(/^dr\.\s*/, "")
    .replace(/al-/g, "al")
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .join(".");
  return `${slug}@nexus-pharmacies.example`;
}
