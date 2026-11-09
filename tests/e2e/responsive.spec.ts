import { expect, test } from "@playwright/test";
import { PAGES } from "./helpers";

for (const locale of ["ar", "en"]) {
  for (const path of [...PAGES, "/branches/NX-C11", "/departments/HR"]) {
    test(`no horizontal overflow on /${locale}${path}`, async ({ page }) => {
      await page.goto(`/${locale}${path}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
}

test("mobile menu opens and navigates", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/en");
  await page.getByTestId("mobile-menu").click();
  await page.getByRole("dialog").getByRole("link", { name: "Employees" }).click();
  await expect(page).toHaveURL(/\/en\/employees$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the day loop is usable on a phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/ar/today");
  await page.locator('[data-scenario="first_priorities"]').getByTestId("scenario-option").first().click();
  await expect(page.locator('[data-scenario="first_priorities"]')).toHaveAttribute("data-state", "decided");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByTestId("end-day").click();
  await expect(page.getByTestId("today-day")).toContainText("2");
});
