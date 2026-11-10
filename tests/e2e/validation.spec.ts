/**
 * Technical validation of the Character, Relationship and Memory engines through the real UI.
 * Each test logs a line `[Tn] ...` with the evidence used for the validation report.
 */
import { expect, test, type Page } from "@playwright/test";

const opsCard = (page: Page) => page.locator('[data-scenario="first_priorities"]');

async function trustOnCard(page: Page, scenario: string): Promise<number> {
  const text = await page.locator(`[data-scenario="${scenario}"]`).getByTestId("scenario-person").first().innerText();
  return Number(/Trust in you\s*(-?\d+)/.exec(text)![1]);
}

async function choose(page: Page, scenario: string, option: number) {
  const card = page.locator(`[data-scenario="${scenario}"]`);
  await card.getByTestId("scenario-option").nth(option).click();
  await expect(card).toHaveAttribute("data-state", "decided");
}

async function endDay(page: Page, next: number) {
  await page.getByTestId("end-day").click();
  await expect(page.getByTestId("today-day")).toHaveText(`Day ${next} of 90`);
}

test("T1–T4: interaction is remembered, trust changes by rule, and survives a refresh", async ({ page, browser }) => {
  await page.goto("/en/today");
  const opsHref = (await opsCard(page).getByTestId("scenario-person").first().getByRole("link").getAttribute("href"))!;
  const opsName = await opsCard(page).getByTestId("scenario-person").first().getByRole("link").innerText();
  const before = await trustOnCard(page, "first_priorities");

  // T1: a meaningful interaction (the Operations Director asks for your 90-day priority).
  await choose(page, "first_priorities", 0);
  const effects = await opsCard(page).getByTestId("effects").innerText();
  console.log(`[T1] ${opsName}: chose "Close the sales gap". Effects shown: ${effects.replace(/\s+/g, " ")}`);

  // T3: rule in scenarios.ts → first_priorities option 0: { kind: "trust", who: "ops", delta: 6 }.
  expect(effects).toContain(`${before} → ${before + 6}`);
  console.log(`[T3] trust ${before} → ${before + 6} (rule: first_priorities option 1 = trust +6)`);

  // T2: the memory is on the employee's profile.
  await page.goto(opsHref);
  await expect(page.getByTestId("memory").first()).toContainText("Promised to close the sales gap");
  console.log(`[T2] memory on profile: "${(await page.getByTestId("memory").first().innerText()).replace(/\s+/g, " ")}"`);

  // T4: refresh — still there; and the same trust value on the relationship card.
  await page.reload();
  await expect(page.getByTestId("memory").first()).toContainText("Promised to close the sales gap");
  await expect(page.getByTestId("memories")).toContainText(`Trust in you now: ${before + 6}`);
  console.log(`[T4] after reload: memory and trust ${before + 6} persist (same browser)`);

  // T4b: a different browser/device has no progress — storage is a cookie, not a database.
  const other = await browser.newContext();
  const p2 = await other.newPage();
  await p2.goto(opsHref);
  await expect(p2.getByTestId("memories")).toContainText("No memories yet");
  console.log(`[T4b] new browser context: no memories (progress is per-browser cookie)`);
  await other.close();
});

test("T5: the next interaction with the same person reflects the previous one", async ({ page }) => {
  await page.goto("/en/today");
  const before = await trustOnCard(page, "first_priorities");
  await choose(page, "first_priorities", 0);
  for (let d = 1; d <= 4; d++) {
    for (;;) {
      const pending = page.locator('[data-testid="scenario"][data-state="pending"]');
      if (!(await pending.count())) break;
      const key = (await pending.first().getAttribute("data-scenario"))!;
      await choose(page, key, 1);
    }
    await endDay(page, d + 1);
  }
  // Day 5 is Thursday: the weekly review with the same Operations Director.
  const card = page.locator('[data-scenario="weekly_review"]');
  await expect(card).toBeVisible();
  const person = await card.getByTestId("scenario-person").first().innerText();
  console.log(`[T5] Day 5 weekly review card: ${person.replace(/\s+/g, " ")}`);
  expect(person).toContain("Promised to close the sales gap");
  const now = await trustOnCard(page, "weekly_review");
  expect(now).not.toBe(before);
});

test("T7: different choices give different outcomes", async ({ browser }) => {
  const outcomes: string[] = [];
  for (const option of [0, 1, 2]) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/en/today");
    await choose(page, "first_priorities", option);
    const text = (await opsCard(page).getByTestId("scenario-outcome").innerText()).replace(/\s+/g, " ");
    outcomes.push(text);
    console.log(`[T7] option ${option + 1}: ${text}`);
    await ctx.close();
  }
  expect(new Set(outcomes).size).toBe(3);
});

test("T8: memories exist only after real interactions", async ({ page }) => {
  await page.goto("/en/today");
  const href = (await opsCard(page).getByTestId("scenario-person").first().getByRole("link").getAttribute("href"))!;
  await page.goto(href);
  await expect(page.getByTestId("memories")).toContainText("No memories yet");
  console.log("[T8] fresh game: Operations Director has no memories");
});

test("T9: where the state lives", async ({ page, context }) => {
  await page.goto("/en/today");
  await choose(page, "first_priorities", 0);
  const cookie = (await context.cookies()).find((c) => c.name === "PR_SIM");
  const local = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
  const health = await (await page.request.get("/api/health")).json();
  console.log(`[T9] cookie PR_SIM=${decodeURIComponent(cookie!.value)} httpOnly=${cookie!.httpOnly}; localStorage=${local.local}; sessionStorage=${local.session}; data mode=${health.mode}`);
  expect(cookie).toBeDefined();
  expect(local.local).toBe(0);
});
