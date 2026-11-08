/**
 * Pure search / filter / sort functions for the directories (unit-tested).
 */
import type { Locale } from "@/domain/common";
import { sortBranches } from "@/lib/analytics";
import type { BranchSummary } from "@/services/branch-service";
import type { EmployeeListItem } from "@/services/people-service";
import type { BranchFilters, EmployeeFilters } from "@/validation/filters";

/** Case- and diacritic-insensitive normalisation for Arabic and English search. */
export function normaliseSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٰٟ]/g, "") // Arabic diacritics
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-_.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matches(query: string | undefined, fields: string[]): boolean {
  if (!query) return true;
  const q = normaliseSearch(query);
  if (!q) return true;
  return fields.some((f) => normaliseSearch(f).includes(q));
}

export function filterBranches(items: BranchSummary[], f: BranchFilters): BranchSummary[] {
  const filtered = items.filter((b) => {
    if (f.group !== "all" && b.branch.performanceGroup !== f.group) return false;
    if (f.status === "on_target" && b.current.achievement < 100) return false;
    if (f.status === "below_target" && b.current.achievement >= 100) return false;
    if (f.status === "attention" && !b.needsAttention) return false;
    return matches(f.q, [b.branch.code, b.branch.name.en, b.branch.name.ar, b.branch.district.en, b.branch.district.ar, b.branch.city.en, b.branch.city.ar]);
  });
  return sortBranches(filtered, f.sort, f.dir);
}

export function filterEmployees(items: EmployeeListItem[], f: EmployeeFilters, locale: Locale = "en"): EmployeeListItem[] {
  const filtered = items.filter((i) => {
    if (f.branch !== "all" && i.branch.code !== f.branch) return false;
    if (f.role !== "all" && i.employee.roleCode !== f.role) return false;
    if (f.experience !== "all" && i.experienceBand !== f.experience) return false;
    if (f.performance !== "all" && i.performanceBand !== f.performance) return false;
    return matches(f.q, [i.employee.employeeCode, i.employee.fullName.en, i.employee.fullName.ar]);
  });
  const sorted = [...filtered];
  switch (f.sort) {
    case "name":
      sorted.sort((a, b) => a.employee.fullName[locale].localeCompare(b.employee.fullName[locale], locale));
      break;
    case "performance":
      sorted.sort((a, b) => b.profile.performanceScore - a.profile.performanceScore || a.employee.employeeCode.localeCompare(b.employee.employeeCode));
      break;
    case "experience":
      sorted.sort((a, b) => b.employee.yearsOfExperience - a.employee.yearsOfExperience || a.employee.employeeCode.localeCompare(b.employee.employeeCode));
      break;
    default:
      sorted.sort((a, b) => a.employee.employeeCode.localeCompare(b.employee.employeeCode));
  }
  return sorted;
}
