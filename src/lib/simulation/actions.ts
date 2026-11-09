"use server";

/**
 * Server actions for the day loop. Each one validates the request against the
 * current replayed simulation, appends to the saved progress and redirects.
 * Forms work without JavaScript.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSimulation } from "@/data/repository";
import { isLocale, type Locale } from "@/lib/i18n";
import { isValidCoachingStart } from "./engine";
import { SCENARIO_BY_CODE } from "./scenarios";
import { encodeProgress, PROGRESS_COOKIE, type Progress } from "./progress";
import type { CoachingFocus } from "./types";

const ONE_YEAR = 60 * 60 * 24 * 365;

function localeOf(formData: FormData): Locale {
  const raw = String(formData.get("locale") ?? "ar");
  return isLocale(raw) ? raw : "ar";
}

async function save(progress: Progress) {
  (await cookies()).set(PROGRESS_COOKIE, encodeProgress(progress), { httpOnly: true, sameSite: "lax", path: "/", maxAge: ONE_YEAR });
}

export async function decide(formData: FormData): Promise<void> {
  const locale = localeOf(formData);
  const instanceId = String(formData.get("scenario") ?? "");
  const option = Number(formData.get("option"));
  const run = await getSimulation();
  const inst = run.pending.find((p) => p.id === instanceId);
  const template = inst ? SCENARIO_BY_CODE.get(inst.code) : undefined;
  if (inst && template && Number.isInteger(option) && option >= 0 && option < template.options.length) {
    await save({ ...run.progress, decisions: [...run.progress.decisions, { day: inst.day, code: inst.code, option }] });
  }
  redirect(`/${locale}/today#${instanceId}`);
}

export async function endDay(formData: FormData): Promise<void> {
  const locale = localeOf(formData);
  const run = await getSimulation();
  // The form carries the day it was rendered for, so a double tap cannot skip two days.
  if (!run.state.completed && Number(formData.get("day")) === run.state.day) {
    await save({ ...run.progress, day: run.state.day + 1 });
  }
  redirect(`/${locale}/today`);
}

export async function resetSimulation(formData: FormData): Promise<void> {
  const locale = localeOf(formData);
  (await cookies()).delete(PROGRESS_COOKIE);
  redirect(`/${locale}/today`);
}

export async function startCoaching(formData: FormData): Promise<void> {
  const locale = localeOf(formData);
  const branchCode = String(formData.get("branch") ?? "");
  const focus = String(formData.get("focus") ?? "");
  const run = await getSimulation();
  if (isValidCoachingStart(run, branchCode, focus)) {
    await save({ ...run.progress, coaching: [...run.progress.coaching, { day: run.state.day, branchCode, focus: focus as CoachingFocus }] });
  }
  redirect(`/${locale}/coaching`);
}
