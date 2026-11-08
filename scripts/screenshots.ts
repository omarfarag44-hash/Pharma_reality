/**
 * Captures screenshots of the running app into docs/screenshots.
 * Usage: start the app (npm run start), then: BASE_URL=http://localhost:3000 npm run screenshots
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, devices } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = resolve(__dirname, "../docs/screenshots");

const desktop: Array<[string, string]> = [
  ["01-dashboard-ar", "/ar"],
  ["02-dashboard-en", "/en"],
  ["03-org-chart-en", "/en/organization"],
  ["04-branches-en", "/en/branches"],
  ["05-branch-detail-en", "/en/branches/NX-C11"],
  ["06-branch-detail-ar", "/ar/branches/NX-C02"],
  ["07-employees-ar", "/ar/employees"],
  ["08-employees-filtered-en", "/en/employees?role=branch_leader&sort=performance"],
  ["10-departments-en", "/en/departments"],
  ["11-department-detail-ar", "/ar/departments/QAC"],
  ["12-peers-en", "/en/peers"],
  ["13-calendar-week-ar", "/ar/calendar"],
  ["14-calendar-day-en", "/en/calendar?view=day"],
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  for (const [name, path] of desktop) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    console.log("✓", name);
  }
  // A person profile reached through the org chart (the CEO) and a branch leader.
  await page.goto(`${BASE}/en/employees?role=branch_leader&branch=NX-C05`, { waitUntil: "networkidle" });
  await page.getByTestId("employee-row").first().getByRole("link").first().click();
  await page.waitForURL(/\/people\//);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${OUT}/09-employee-profile-en.png`, fullPage: true });
  console.log("✓ 09-employee-profile-en");

  const mobile = await browser.newPage({ ...devices["iPhone 13"] });
  for (const [name, path] of [["15-mobile-dashboard-ar", "/ar"], ["16-mobile-branches-en", "/en/branches"]] as const) {
    await mobile.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await mobile.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    console.log("✓", name);
  }
  await mobile.getByTestId("mobile-menu").click();
  await mobile.waitForTimeout(300);
  await mobile.screenshot({ path: `${OUT}/17-mobile-menu-en.png` });
  console.log("✓ 17-mobile-menu-en");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
