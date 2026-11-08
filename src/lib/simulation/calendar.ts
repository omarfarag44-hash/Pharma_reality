/**
 * 90-day simulation calendar structure. Pure date arithmetic in UTC.
 * Sprint 1 displays structure only; no events are simulated.
 */
import type { SimulationSession } from "@/domain/organization";

export interface CalendarDay {
  dayNumber: number;
  date: string; // YYYY-MM-DD
  weekday: number; // 0 = Sunday … 6 = Saturday
  /** Friday and Saturday are the weekend in Saudi Arabia. */
  isWeekend: boolean;
  weekNumber: number;
  monthNumber: number;
  status: "past" | "current" | "upcoming";
}

export interface CalendarWeek {
  weekNumber: number;
  startDay: number;
  endDay: number;
  startDate: string;
  endDate: string;
  days: CalendarDay[];
  status: "past" | "current" | "upcoming";
}

export interface CalendarMonth {
  monthNumber: number;
  startDay: number;
  endDay: number;
  startDate: string;
  endDate: string;
  weeks: number[];
  status: "past" | "current" | "upcoming";
}

export interface SimulationCalendar {
  session: SimulationSession;
  currentDate: string;
  endDate: string;
  days: CalendarDay[];
  weeks: CalendarWeek[];
  months: CalendarMonth[];
  progressPct: number;
}

/** Simulation months are fixed 30-day periods: days 1–30, 31–60, 61–90. */
export const DAYS_PER_SIM_MONTH = 30;

export function addDaysIso(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function statusOf(start: number, end: number, current: number): "past" | "current" | "upcoming" {
  if (current > end) return "past";
  if (current < start) return "upcoming";
  return "current";
}

export function buildCalendar(session: SimulationSession): SimulationCalendar {
  const { startDate, lengthDays, currentDay } = session;
  const days: CalendarDay[] = Array.from({ length: lengthDays }, (_, i) => {
    const dayNumber = i + 1;
    const date = addDaysIso(startDate, i);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    return {
      dayNumber,
      date,
      weekday,
      isWeekend: weekday === 5 || weekday === 6,
      weekNumber: Math.floor(i / 7) + 1,
      monthNumber: Math.floor(i / DAYS_PER_SIM_MONTH) + 1,
      status: dayNumber < currentDay ? "past" : dayNumber === currentDay ? "current" : "upcoming",
    };
  });

  const weekCount = Math.ceil(lengthDays / 7);
  const weeks: CalendarWeek[] = Array.from({ length: weekCount }, (_, w) => {
    const wd = days.filter((d) => d.weekNumber === w + 1);
    const startDay = wd[0]!.dayNumber;
    const endDay = wd[wd.length - 1]!.dayNumber;
    return { weekNumber: w + 1, startDay, endDay, startDate: wd[0]!.date, endDate: wd[wd.length - 1]!.date, days: wd, status: statusOf(startDay, endDay, currentDay) };
  });

  const monthCount = Math.ceil(lengthDays / DAYS_PER_SIM_MONTH);
  const months: CalendarMonth[] = Array.from({ length: monthCount }, (_, m) => {
    const md = days.filter((d) => d.monthNumber === m + 1);
    const startDay = md[0]!.dayNumber;
    const endDay = md[md.length - 1]!.dayNumber;
    return {
      monthNumber: m + 1,
      startDay,
      endDay,
      startDate: md[0]!.date,
      endDate: md[md.length - 1]!.date,
      weeks: [...new Set(md.map((d) => d.weekNumber))],
      status: statusOf(startDay, endDay, currentDay),
    };
  });

  return {
    session,
    currentDate: addDaysIso(startDate, currentDay - 1),
    endDate: addDaysIso(startDate, lengthDays - 1),
    days,
    weeks,
    months,
    progressPct: ((currentDay - 1) / lengthDays) * 100,
  };
}
