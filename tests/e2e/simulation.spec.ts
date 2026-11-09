import { expect, test, type Page } from "@playwright/test";

/** Each test gets its own browser context, so progress (a cookie) starts at Day 1. */

async function decideAll(page: Page) {
  while ((await page.getByTestId("scenario-option").count()) > 0) {
    const before = await page.locator('[data-testid="scenario"][data-state="pending"]').count();
    await page.getByTestId("scenario-option").first().click();
    await expect(page.locator('[data-testid="scenario"][data-state="pending"]')).toHaveCount(before - 1);
  }
}

async function endDay(page: Page, expectedNextDay: number) {
  await page.getByTestId("end-day").click();
  await expect(page.getByTestId("today-day")).toContainText(String(expectedNextDay));
}

test("Day 1 opens with the first-priorities situation and nothing decided", async ({ page }) => {
  await page.goto("/en/today");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Today");
  await expect(page.getByTestId("today-day")).toHaveText("Day 1 of 90");
  await expect(page.locator('[data-scenario="first_priorities"]')).toBeVisible();
  await expect(page.getByTestId("end-day-warning")).toBeVisible();
  await expect(page.getByTestId("today-card")).toHaveCount(0);
  await page.goto("/en");
  await expect(page.getByTestId("today-card")).toContainText("waiting for your decision");
});

test("a decision shows its outcome and effects, and ending the day advances the calendar", async ({ page }) => {
  await page.goto("/en/today");
  const card = page.locator('[data-scenario="first_priorities"]');
  await card.getByTestId("scenario-option").first().click();
  await expect(card).toHaveAttribute("data-state", "decided");
  await expect(card.getByTestId("scenario-outcome")).toContainText("Your choice");
  await expect(card.getByTestId("effects")).toContainText("Trust");

  await decideAll(page);
  await expect(page.getByTestId("all-handled")).toBeVisible();
  await endDay(page, 2);
  await expect(page.getByTestId("simulation-day")).toContainText("2");

  await page.goto("/en/calendar?view=day");
  await expect(page.locator('[data-testid="calendar-day"][data-current="true"]')).toHaveAttribute("data-day", "2");
  await expect(page.locator('[data-testid="calendar-day"][data-day="1"]')).not.toHaveAttribute("data-decisions", "0");
});

test("decisions change branch figures, which are tagged as changed by your decisions", async ({ page }) => {
  await page.goto("/en/today");
  // Play the first week, always taking the first option.
  for (let day = 1; day <= 4; day++) {
    await decideAll(page);
    await endDay(page, day + 1);
  }
  await page.goto("/en/leadership");
  await expect(page.getByTestId("dna-decisions-value")).not.toHaveText("0");
  await expect(page.getByTestId("dna-style")).not.toContainText("still forming");
  await expect(page.getByTestId("decision-log").locator("li")).not.toHaveCount(0);

  // At least one branch now shows a situation with a metric effect.
  let found = false;
  for (let n = 1; n <= 15 && !found; n++) {
    await page.goto(`/en/branches/NX-C${String(n).padStart(2, "0")}`);
    found = (await page.getByTestId("changed-by-decisions").count()) > 0;
  }
  expect(found).toBe(true);
  await expect(page.getByTestId("branch-situations")).toBeVisible();
});

test("people remember the decisions that involved them", async ({ page }) => {
  await page.goto("/en/today");
  const card = page.locator('[data-scenario="first_priorities"]');
  const opsLink = card.getByTestId("scenario-person").first().getByRole("link");
  const href = await opsLink.getAttribute("href");
  await card.getByTestId("scenario-option").first().click();
  await expect(card).toHaveAttribute("data-state", "decided");
  await page.goto(href!);
  await expect(page.getByTestId("memories")).toBeVisible();
  await expect(page.getByTestId("memory").first()).toContainText("sales gap");
});

test("ending a day with open situations counts them as not handled", async ({ page }) => {
  await page.goto("/en/today");
  await endDay(page, 2);
  await page.goto("/en/leadership");
  await expect(page.getByTestId("decision-log")).toContainText("Not handled");
});

test("coaching plans can be started and show as active", async ({ page }) => {
  await page.goto("/en/coaching");
  await page.locator('select[name="branch"]').selectOption("NX-C03");
  await page.locator('select[name="focus"]').selectOption("compliance");
  await page.getByTestId("coaching-start").click();
  await expect(page.locator('[data-testid="coaching-plan"][data-status="active"]')).toHaveCount(1);
  await expect(page.locator('select[name="branch"] option[value="NX-C03"]')).toHaveCount(0);
});

test("restart goes back to Day 1", async ({ page }) => {
  await page.goto("/en/today");
  await endDay(page, 2);
  await page.locator("summary", { hasText: "Restart the simulation" }).click();
  await page.getByTestId("reset-simulation").click();
  await expect(page.getByTestId("today-day")).toHaveText("Day 1 of 90");
});

test("the day loop works in Arabic (RTL)", async ({ page }) => {
  await page.goto("/ar/today");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("اليوم");
  await expect(page.locator('[data-scenario="first_priorities"]')).toContainText("أول 90 يومًا لك");
  await page.locator('[data-scenario="first_priorities"]').getByTestId("scenario-option").first().click();
  await expect(page.locator('[data-scenario="first_priorities"]')).toContainText("اختيارك");
});
