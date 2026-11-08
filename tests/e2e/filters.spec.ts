import { expect, test } from "@playwright/test";

test("employee search by name and by ID", async ({ page }) => {
  await page.goto("/en/employees");
  const firstCode = (await page.getByTestId("employee-row").first().locator("td").nth(1).textContent())!.trim();
  await page.getByTestId("filter-search").fill(firstCode);
  await expect(page).toHaveURL(new RegExp(`q=${firstCode}`));
  await expect(page.getByTestId("employee-row")).toHaveCount(1);
  await page.getByTestId("filter-reset").click();
  await expect(page.getByTestId("employee-row")).toHaveCount(60);

  await page.getByTestId("filter-search").fill("Al-");
  await expect(page.getByTestId("employee-row")).toHaveCount(60);
  await page.getByTestId("filter-search").fill("zzzz-no-match");
  await expect(page.getByText("No results match these filters.")).toBeVisible();
});

test("employee filters by branch, role, experience and performance", async ({ page }) => {
  await page.goto("/en/employees");
  await page.getByTestId("filter-branch").selectOption("NX-C07");
  await expect(page.getByTestId("employee-row")).toHaveCount(4);
  await page.getByTestId("filter-role").selectOption("branch_leader");
  await expect(page.getByTestId("employee-row")).toHaveCount(1);
  await page.getByTestId("filter-reset").click();
  await page.getByTestId("filter-role").selectOption("branch_leader");
  await expect(page.getByTestId("employee-row")).toHaveCount(15);
  await page.getByTestId("filter-reset").click();
  await page.getByTestId("filter-experience").selectOption("0-2");
  await expect(page).toHaveURL(/experience=0-2/);
  const n = await page.getByTestId("employee-row").count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(60);
  await page.getByTestId("filter-reset").click();
  await page.getByTestId("filter-performance").selectOption("exceptional");
  await expect(page).toHaveURL(/performance=exceptional/);
  const scores = await page.getByTestId("employee-row").locator("td:last-child span span:first-child").allTextContents();
  expect(scores.length).toBeGreaterThan(0);
  scores.forEach((s) => expect(Number(s)).toBeGreaterThanOrEqual(90));
});

test("Arabic search finds employees by Arabic name", async ({ page }) => {
  await page.goto("/ar/employees?branch=NX-C01");
  const name = (await page.getByTestId("employee-row").first().locator("a span span").first().textContent())!.trim();
  await page.goto("/ar/employees");
  await page.getByTestId("filter-search").fill(name);
  await expect(page.getByTestId("employee-row").first()).toContainText(name);
});

test("branch filters, performance filter and sorting", async ({ page }) => {
  await page.goto("/en/branches");
  await page.getByTestId("filter-group").selectOption("A");
  await expect(page.getByTestId("branch-row")).toHaveCount(5);
  await page.getByTestId("filter-reset").click();
  await page.getByTestId("filter-search").fill("kharj");
  await expect(page.getByTestId("branch-row")).toHaveCount(2);
  await page.getByTestId("filter-reset").click();

  await page.getByTestId("filter-status").selectOption("attention");
  await expect(page).toHaveURL(/status=attention/);
  const attention = await page.getByTestId("branch-row").count();
  expect(attention).toBeGreaterThan(0);
  expect(attention).toBeLessThan(15);
  await page.getByTestId("filter-reset").click();

  await page.getByTestId("filter-sort").selectOption("sales");
  await expect(page).toHaveURL(/sort=sales/);
  await expect(page.getByTestId("branch-row").first()).toHaveAttribute("data-code", "NX-C01");
  await page.getByTestId("filter-sort").selectOption("compliance");
  await page.getByTestId("filter-dir").selectOption("asc");
  await expect(page).toHaveURL(/dir=asc/);
  const first = await page.getByTestId("branch-row").first().getAttribute("data-code");
  expect(Number(first!.slice(-2))).toBeGreaterThanOrEqual(11); // weakest compliance is in the recovery group
});
