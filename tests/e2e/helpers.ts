export const EXPECTED_MODE = process.env.E2E_DATABASE_URL ? "postgres" : "demo";
export const BRANCH_CODES = Array.from({ length: 15 }, (_, i) => `NX-C${String(i + 1).padStart(2, "0")}`);
export const PAGES = ["", "/organization", "/branches", "/employees", "/departments", "/peers", "/calendar"];
