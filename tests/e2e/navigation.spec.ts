import { expect, test } from "@playwright/test";
import { EXPECTED_MODE, PAGES } from "./helpers";

test("root redirects to Arabic RTL by default and shows the data mode", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByTestId("data-mode")).toHaveAttribute("data-mode", EXPECTED_MODE);
  await expect(page.getByTestId("simulation-day")).toContainText("1");
});

test("sidebar navigation reaches every Sprint 1 screen", async ({ page }) => {
  await page.goto("/en");
  const nav = page.getByRole("navigation", { name: "Menu" }).first();
  const expected: Array<[string, RegExp, string]> = [
    ["Organization chart", /\/en\/organization$/, "Organization chart"],
    ["Branches", /\/en\/branches$/, "Branch directory"],
    ["Employees", /\/en\/employees$/, "Employee directory"],
    ["Departments", /\/en\/departments$/, "Central departments"],
    ["Peer supervisors", /\/en\/peers$/, "Peer Area Supervisors"],
    ["Simulation calendar", /\/en\/calendar$/, "Simulation calendar"],
    ["Dashboard", /\/en$/, "Area overview"],
  ];
  for (const [link, url, heading] of expected) {
    await nav.getByRole("link", { name: link }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  }
});

test("language switch keeps the page and filters and flips direction", async ({ page }) => {
  await page.goto("/ar/branches?group=C");
  await page.getByTestId("language-switch").click();
  await expect(page).toHaveURL(/\/en\/branches\?group=C$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByTestId("branch-row")).toHaveCount(5);
  await page.getByTestId("language-switch").click();
  await expect(page).toHaveURL(/\/ar\/branches\?group=C$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

for (const locale of ["ar", "en"]) {
  for (const path of PAGES) {
    test(`renders /${locale}${path} without console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      const res = await page.goto(`/${locale}${path}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}

test("unknown pages and records return 404", async ({ page }) => {
  expect((await page.goto("/en/does-not-exist"))?.status()).toBe(404);
  expect((await page.goto("/en/branches/NX-C99"))?.status()).toBe(404);
  expect((await page.goto("/en/people/00000000-0000-0000-0000-000000000000"))?.status()).toBe(404);
});

test("health endpoint reports the organisation counts", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toMatchObject({ status: "ok", mode: EXPECTED_MODE, counts: { branches: 15, pharmacists: 60, branchLeaders: 15, departments: 8, peerSupervisors: 3 } });
});
