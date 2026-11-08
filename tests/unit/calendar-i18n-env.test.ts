import { describe, expect, it } from "vitest";
import { buildCalendar } from "@/lib/simulation/calendar";
import { resolveEnv } from "@/lib/env";
import { en } from "@/lib/i18n/dictionaries/en";
import { ar } from "@/lib/i18n/dictionaries/ar";
import { dirOf, fmt } from "@/lib/i18n";

describe("simulation calendar", () => {
  const cal = buildCalendar({ id: "s", status: "active", startDate: "2027-01-03", lengthDays: 90, currentDay: 1 });
  it("has 90 days, 13 weeks and 3 simulation months", () => {
    expect(cal.days).toHaveLength(90);
    expect(cal.weeks).toHaveLength(13);
    expect(cal.weeks[12]!.days).toHaveLength(6);
    expect(cal.months.map((m) => [m.startDay, m.endDay])).toEqual([[1, 30], [31, 60], [61, 90]]);
  });
  it("marks Day 1 as current with the right virtual date", () => {
    expect(cal.currentDate).toBe("2027-01-03");
    expect(cal.days.filter((d) => d.status === "current").map((d) => d.dayNumber)).toEqual([1]);
    expect(cal.weeks[0]!.status).toBe("current");
    expect(cal.months[0]!.status).toBe("current");
    expect(cal.endDate).toBe("2027-04-02");
    expect(cal.progressPct).toBe(0);
  });
  it("treats Friday and Saturday as the weekend", () => {
    const fri = cal.days.find((d) => d.date === "2027-01-08")!;
    const sat = cal.days.find((d) => d.date === "2027-01-09")!;
    const sun = cal.days.find((d) => d.date === "2027-01-03")!;
    expect([fri.isWeekend, sat.isWeekend, sun.isWeekend]).toEqual([true, true, false]);
  });
  it("tracks progress later in the simulation", () => {
    const later = buildCalendar({ id: "s", status: "active", startDate: "2027-01-03", lengthDays: 90, currentDay: 45 });
    expect(later.months[0]!.status).toBe("past");
    expect(later.months[1]!.status).toBe("current");
    expect(later.days.filter((d) => d.status === "past")).toHaveLength(44);
  });
});

describe("localisation", () => {
  const keys = (o: unknown, p = ""): string[] =>
    typeof o === "object" && o !== null ? Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k)) : [p];
  it("has identical keys in Arabic and English", () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });
  it("has no empty Arabic strings", () => {
    const values = (o: unknown): string[] => (typeof o === "object" && o !== null ? Object.values(o).flatMap(values) : [String(o)]);
    const empty = values(ar).filter((v) => v.trim() === "");
    // Only unit labels for "count"/"score" are intentionally empty.
    expect(empty.length).toBe(2);
  });
  it("sets direction and interpolates", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
    expect(fmt("{n} of {total}", { n: 2, total: 3 })).toBe("2 of 3");
  });
});

describe("environment resolution", () => {
  it("defaults to demo mode without credentials", () => {
    expect(resolveEnv({}).mode).toBe("demo");
    expect(resolveEnv({ NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }).mode).toBe("demo");
  });
  it("selects supabase or postgres when configured", () => {
    expect(resolveEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "x".repeat(40) }).mode).toBe("supabase");
    expect(resolveEnv({ DATABASE_URL: "postgres://u@localhost/db" }).mode).toBe("postgres");
  });
  it("falls back to demo with a warning when a forced mode is misconfigured", () => {
    const r = resolveEnv({ PHARMA_DATA_MODE: "supabase" });
    expect(r.mode).toBe("demo");
    expect(r.warning).toMatch(/Supabase/);
    expect(resolveEnv({ NEXT_PUBLIC_SUPABASE_URL: "not a url", NEXT_PUBLIC_SUPABASE_ANON_KEY: "x".repeat(40) }).mode).toBe("demo");
  });
});
