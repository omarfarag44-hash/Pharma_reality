# Test results — Sprint 1

Everything below was **actually executed** on 2026-11-07 in the build container.
- **Runtime:** Node 22.23, Next.js 15.5.4, PostgreSQL 16.15 (local), Chromium (Playwright 1.63).
- **Not executed:** anything that needs a live Supabase project (see the end of this file).

## Static checks

| Check | Command | Result |
|---|---|---|
| TypeScript (strict) | `npm run typecheck` | ✅ 0 errors |
| ESLint | `npm run lint` | ✅ 0 errors, 0 warnings |
| Production build | `npm run build` | ✅ succeeds; every page is server-rendered on demand |

## Unit and integration tests (Vitest)

Command: `TEST_DATABASE_URL=postgres://postgres@127.0.0.1:54329/pharma_reality npm test`.
Result: **66 / 66 passed** across 7 files.

| File | Tests | Covers |
|---|---|---|
| `tests/unit/analytics.test.ts` | 19 | achievement, stock/compliance/expiry/slow-moving indicators, thresholds and statuses, attention score, performance index, aggregation |
| `tests/unit/seed.test.ts` | 14 | determinism, counts (15/60/15/8/3), one leader per branch, unique codes and names, integrity rules, provenance |
| `tests/unit/calendar-i18n-env.test.ts` | 10 | 90-day calendar, Fri/Sat weekend, weeks and periods, dictionary parity, env and demo fallback |
| `tests/unit/directory.test.ts` | 10 | search normalisation (Arabic/English), branch and employee filters, URL param validation |
| `tests/unit/services.test.ts` | 6 | org chart, departments, peers, dashboard view models |
| `tests/unit/rows.test.ts` | 3 | dataset ↔ table rows round trip |
| `tests/integration/postgres.test.ts` | 4 | the items below |

What the 4 PostgreSQL integration tests check, against real PostgreSQL 16:
- Migrations and seed apply, and the loaded dataset equals the generated one.
- CHECK and unique constraints reject bad rows.
- The audit trigger writes `audit_logs`.
- **RLS:**
  - The anonymous role sees 0 rows.
  - An authenticated user linked to the organisation sees 15 branches and 60 pharmacists.
  - Updates are blocked.

Without `TEST_DATABASE_URL` the integration file is skipped and 62 unit tests run.
The local database comes from `npm run db:local`, which runs initdb, applies a small shim
of the Supabase `auth` schema and roles, then the migrations and `supabase/seed.sql`.

## End-to-end tests (Playwright)

**Projects:**
- `desktop`: Chrome at 1440×900.
- `mobile`: Pixel 7, responsive spec only.

There are 84 tests in total. One test is mobile-only and is skipped in the desktop project by design.

| Run | Command | Result |
|---|---|---|
| Demo mode | `npm run test:e2e -- --trace off` | ✅ **83 passed, 1 skipped** |
| PostgreSQL mode | `E2E_DATABASE_URL=postgres://… npm run test:e2e -- --trace off` | ✅ **83 passed, 1 skipped** |

**Coverage:**
- **Navigation:** redirect to `/ar`, RTL/LTR, and the sidebar reaching every screen.
- **Language switch:** keeps the page and its filters.
- **Pages:** all 14 pages in both languages render with no console errors. Unknown records return 404, and `/api/health` reports the counts.
- **Organization:** organisation counts on the chart, branch and department expansion, branch detail, profile, departments, peers and calendar.
- **Filters:** search, group and status filters, combined filters, reset, and URL state.
- **Responsive:** no horizontal overflow on any page at phone width, and the mobile menu works.

### Known intermittent issue

When the navigation spec runs repeatedly with 4 parallel workers (`--repeat-each=8`), roughly
1 page load in 150 logs a React hydration warning (#418). This happens in both demo and Postgres modes.
- React recovers by re-rendering on the client, and the page then looks and works normally.
- With 1 worker, 304 of 304 repeated loads were clean.
- The server HTML and the final DOM are structurally identical once React's comment markers are removed.

This points to a timing race under CPU load rather than non-deterministic rendering. The root cause has
not been pinned down; it is listed for Sprint 2. The normal (non-repeated) suite passed cleanly in both modes.

## Manual verification

- I checked screenshots of every screen in both languages and on mobile (`docs/screenshots/`, 17 images).
- **Counts** (via `/api/health` and the unit tests):
  - 15 branches, 60 pharmacists, 15 Branch Leaders.
  - 8 departments, 3 peer supervisors, 96 employees in total.
  - 99 reporting lines and 99 relationships.
  - 111 metric snapshots and 90 simulation days.

## Not tested

- **Live Supabase.** No Supabase project or credentials were available. Not run:
  - email/password sign-in, `middleware` session refresh and the login redirect
  - the Supabase PostgREST data source
  - `link_auth_user()` against real `auth.users`

  RLS itself *was* tested on PostgreSQL with a shim of the Supabase auth schema.
- **Browsers.** Firefox and WebKit were not run; only Chromium.
- **Accessibility.** No screen reader pass was done beyond semantic markup, labels and keyboard focus styles.
