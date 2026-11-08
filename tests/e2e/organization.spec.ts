import { expect, test } from "@playwright/test";
import { BRANCH_CODES } from "./helpers";

test("dashboard shows calculated headline numbers", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByTestId("kpi-branches-value")).toHaveText("15");
  await expect(page.getByTestId("kpi-employees-value")).toHaveText("60");
  await expect(page.getByTestId("kpi-employees")).toContainText("15 Branch Leaders");
  await expect(page.getByTestId("kpi-achievement-value")).toHaveText(/^\d{2,3}\.\d%$/);
  await expect(page.getByTestId("attention-list").locator("li").first()).toBeVisible();
});

test("branch directory lists all 15 branches", async ({ page }) => {
  await page.goto("/en/branches");
  await expect(page.getByTestId("branch-row")).toHaveCount(15);
  const codes = await page.getByTestId("branch-row").evaluateAll((rows) => rows.map((r) => r.getAttribute("data-code")));
  expect([...codes].sort()).toEqual(BRANCH_CODES);
});

for (const code of BRANCH_CODES) {
  test(`branch ${code} has 4 staff, one leader and operational indicators`, async ({ page }) => {
    await page.goto(`/en/branches/${code}`);
    await expect(page.getByText(code, { exact: true }).first()).toBeVisible();
    const staff = page.getByTestId("branch-staff").locator(":scope > li");
    await expect(staff).toHaveCount(4);
    await expect(page.getByTestId("branch-staff").getByText("Branch Leader", { exact: true }).locator("visible=true")).not.toHaveCount(0);
    await expect(page.getByTestId("operational-indicators")).toContainText("Stock availability");
  });
}

test("employee directory has exactly 60 records and 15 leaders", async ({ page }) => {
  await page.goto("/en/employees");
  await expect(page.getByTestId("employee-row")).toHaveCount(60);
  await expect(page.locator('[data-testid="employee-row"][data-leader="true"]')).toHaveCount(15);
});

test("employee profile links back to branch and manager", async ({ page }) => {
  await page.goto("/en/employees?role=junior_pharmacist");
  await page.getByTestId("employee-row").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/en\/people\//);
  await expect(page.getByTestId("person-branch")).toBeVisible();
  await expect(page.getByTestId("reporting")).toContainText("Branch Leader");
  await expect(page.getByTestId("strengths").locator("li")).toHaveCount(3);
  await expect(page.getByTestId("personality")).toContainText("Conscientiousness");
  await page.getByTestId("person-branch").click();
  await expect(page).toHaveURL(/\/en\/branches\/NX-C\d{2}$/);
});

test("org chart opens profiles and expands branches", async ({ page }) => {
  await page.goto("/en/organization");
  await expect(page.getByTestId("org-branch")).toHaveCount(15);
  await expect(page.getByTestId("org-department")).toHaveCount(8);
  await expect(page.getByTestId("org-branch-members")).toHaveCount(0);
  await page.getByTestId("org-toggle-all").click();
  await expect(page.getByTestId("org-branch-members")).toHaveCount(15);
  await expect(page.getByTestId("org-branch-members").locator("li")).toHaveCount(45);
  await page.getByTestId("org-person").filter({ hasText: "Chief Executive Officer" }).click();
  await expect(page).toHaveURL(/\/en\/people\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dr. Abdulrahman Al-Mansour");
  await expect(page.getByTestId("reporting")).toContainText("Operations Director");
});

test("departments: eight with head, KPIs and members", async ({ page }) => {
  await page.goto("/en/departments");
  await expect(page.getByTestId("department-card")).toHaveCount(8);
  await page.getByRole("link", { name: "Quality & Compliance", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/departments\/QAC$/);
  await expect(page.getByTestId("kpi-list").locator("li")).toHaveCount(3);
  await expect(page.getByTestId("department-members").locator(":scope > li")).toHaveCount(3);
  await expect(page.getByTestId("responsibilities").locator("li")).toHaveCount(4);
});

test("peer supervisors: three with region, indicators and relationship", async ({ page }) => {
  await page.goto("/en/peers");
  await expect(page.getByTestId("peer-card")).toHaveCount(3);
  for (const region of ["Western Region", "Eastern Region", "Southern Region"]) await expect(page.getByTestId("peer-list")).toContainText(region);
  await expect(page.getByTestId("peer-relationship")).toHaveCount(3);
  await expect(page.getByTestId("peer-list")).toContainText("Rivalry");
});

test("calendar shows Day 1 of 90 in day, week and month views", async ({ page }) => {
  await page.goto("/en/calendar?view=day");
  await expect(page.getByTestId("calendar-current-day")).toContainText("Day 1");
  await expect(page.getByTestId("calendar-current-date")).toContainText("3 January 2027");
  await expect(page.getByTestId("calendar-day")).toHaveCount(90);
  await expect(page.locator('[data-testid="calendar-day"][data-current="true"]')).toHaveAttribute("data-day", "1");
  await page.getByTestId("calendar-view").getByRole("link", { name: "Weekly" }).click();
  await expect(page.getByTestId("calendar-weeks").locator(":scope > li")).toHaveCount(13);
  await page.getByTestId("calendar-view").getByRole("link", { name: "Monthly" }).click();
  await expect(page.getByTestId("calendar-months").locator(":scope > li")).toHaveCount(3);
});
