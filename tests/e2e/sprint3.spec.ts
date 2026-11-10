/**
 * Sprint 3 through the real UI: reactions, end-of-day report (Situational Leadership
 * evaluation hidden until the day closes), briefing, development levels and knowledge base.
 */
import { expect, test, type Page } from "@playwright/test";

async function playDay(page: Page, day: number, option: number) {
  for (;;) {
    const pending = page.locator('[data-testid="scenario"][data-state="pending"]');
    if (!(await pending.count())) break;
    const card = pending.first();
    const key = (await card.getAttribute("data-scenario"))!;
    const options = card.getByTestId("scenario-option");
    await options.nth(Math.min(option, (await options.count()) - 1)).click();
    await expect(page.locator(`[data-scenario="${key}"]`).first()).toHaveAttribute("data-state", "decided");
  }
  await page.getByTestId("end-day").click();
  await expect(page.getByTestId("today-day")).toContainText(String(day + 1));
}

test("a leadership moment: reaction now, evaluation only in the end-of-day report", async ({ page }) => {
  await page.goto("/en/today");
  let reportDay = 0;
  for (let day = 1; day <= 6 && !reportDay; day++) {
    // Before the day closes: no style evaluation anywhere on Today.
    await expect(page.getByTestId("leadership-moment")).toHaveCount(0);
    const pending = page.locator('[data-testid="scenario"][data-state="pending"]');
    let hadReaction = false;
    for (;;) {
      if (!(await pending.count())) break;
      const card = pending.first();
      const key = (await card.getAttribute("data-scenario"))!;
      await card.getByTestId("scenario-option").nth(1).click();
      const decided = page.locator(`[data-scenario="${key}"]`).first();
      await expect(decided).toHaveAttribute("data-state", "decided");
      if (await decided.getByTestId("reaction").count()) {
        hadReaction = true;
        console.log(`[S3-UI] day ${day} ${key} reaction: ${(await decided.getByTestId("reaction").innerText()).replace(/\s+/g, " ")}`);
      }
    }
    await expect(page.getByTestId("leadership-moment")).toHaveCount(0);
    await page.getByTestId("end-day").click();
    await expect(page.getByTestId("today-day")).toHaveText(`Day ${day + 1} of 90`);
    if (hadReaction) reportDay = day;
  }
  expect(reportDay).toBeGreaterThan(0);

  // The briefing links to the report of the day that just closed.
  await expect(page.getByTestId("briefing")).toBeVisible();
  await page.getByTestId("open-report").click();
  await expect(page).toHaveURL(new RegExp(`/en/report/${reportDay}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`End-of-day report · Day ${reportDay}`);
  const moment = page.getByTestId("leadership-moment").first();
  await expect(moment).toBeVisible();
  await expect(moment.getByTestId("leadership-diagnosis")).toContainText("competence");
  await expect(moment).toContainText("S2 · Coaching");
  const text = (await moment.innerText()).replace(/\s+/g, " ");
  console.log(`[S3-UI] report day ${reportDay}: ${text}`);
  await expect(page.getByTestId("report-people")).toBeVisible();

  // And the Leadership page counts it.
  await page.goto("/en/leadership");
  await expect(page.getByTestId("sl-moments-value")).not.toHaveText("0");
  await expect(page.getByTestId("sl-pattern")).toBeVisible();

  // Calendar: a past working day opens its report.
  await page.goto("/en/calendar?view=day");
  await page.locator(`[data-testid="calendar-day"][data-day="${reportDay}"]`).click();
  await expect(page).toHaveURL(new RegExp(`/en/report/${reportDay}$`));
});

test("the current day's report is not available before the day closes", async ({ page }) => {
  await page.goto("/en/report/1");
  await expect(page.getByTestId("report-not-closed")).toBeVisible();
  await page.goto("/en/leadership");
  await expect(page.getByTestId("sl-empty")).toBeVisible();
});

test("ending a day produces an Arabic report too", async ({ page }) => {
  await page.goto("/ar/today");
  await playDay(page, 1, 0);
  await page.goto("/ar/report/1");
  await expect(page.getByTestId("day-report")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("تقرير نهاية اليوم");
});

test("a profile shows development level per task", async ({ page }) => {
  await page.goto("/en/today");
  const href = (await page.locator('[data-scenario="first_priorities"]').getByTestId("scenario-person").first().getByRole("link").getAttribute("href"))!;
  await page.goto(href);
  const rows = page.getByTestId("dev-level");
  await expect(rows).toHaveCount(9);
  const levels = await rows.evaluateAll((els) => els.map((e) => `${e.getAttribute("data-task")}=${e.getAttribute("data-level")}`));
  console.log(`[S3-UI] development levels: ${levels.join(" ")}`);
  await expect(page.getByTestId("overall-commitment")).toHaveText(/^\d+$/);
});

test("the knowledge base separates research from teaching models", async ({ page }) => {
  await page.goto("/en/knowledge");
  const all = await page.getByTestId("knowledge-entry").count();
  expect(all).toBeGreaterThanOrEqual(20);
  await page.getByRole("link", { name: "Research finding" }).click();
  await expect(page).toHaveURL(/kind=research/);
  const research = page.getByTestId("knowledge-entry");
  expect(await research.count()).toBeLessThan(all);
  for (const kind of await research.evaluateAll((els) => els.map((e) => e.getAttribute("data-kind")))) expect(kind).toBe("research");
  await page.goto("/ar/knowledge");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("مكتبة المراجع");
});
