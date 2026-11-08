# Sprint 1 report — Pharma Reality

NEXUS PHARMACIES is fictional. All identities and figures are synthetic. The structure is invented
for the simulation and does not represent any real company's organisation.

## Completed

**Foundation**
- Next.js 15 App Router, React 19, strict TypeScript, Tailwind v4, and shadcn/ui-style components.
- Zod, Recharts, Vitest and Playwright.
- Arabic RTL by default and an English switch. Every page is available in both languages, the choice is remembered in a cookie, and the switch keeps the current page and its filters.
- Three data modes behind one repository interface:
  - **demo:** no setup, and it never crashes on missing env vars.
  - **postgres:** server-only `DATABASE_URL`.
  - **supabase:** Auth with RLS, anon key only.
- A mode banner and `/api/health` endpoint.

**Data**
- **Deterministic seed:** 15 branches (groups A/B/C) with 60 pharmacists, including 15 Branch Leaders.
- **Leadership and peers:** CEO, Operations Director, the player (Area Supervisor) and 3 peer supervisors.
- **Departments:** 8 departments, with heads, members and KPIs.
- **Relationships:** reporting lines (solid and dotted) and relationships such as rivalry, collaboration and mentoring.
- **Employee profiles:** personality, communication style, strengths and development areas.
- **Records:** attendance and training records.
- **Metrics:** 6 months of synthetic history plus the Day-1 current month.
- **Provenance:** every metric is tagged `synthetic_historical`, `simulated_current` or `scenario_generated`, and the tag is shown in the UI.
- **Migrations:**
  - The full core schema with constraints, an audit trigger, `updated_at` triggers, and RLS on every table.
  - Simulation foundation tables (sessions and days, with 90 days generated).
  - Reserved tables for scenario events, decisions, character memories, leadership assessments and coaching plans.
- **Seed SQL:** `supabase/seed.sql` is generated from the same code as demo mode.

**Screens**
- **A. Dashboard:** area KPIs, branch achievement chart, attention list and regional comparison.
- **B. Org chart:** an interactive chart with expandable branches and departments.
- **C. Branch directory:** search, group/status filters and sorting, all held in the URL.
- **D. Branch details:** KPIs, sales vs target, indicators vs the area average, trends, team and distribution.
- **E. Employee directory:** search plus branch, role, experience and performance filters.
- **F. Employee profile:** role, manager, relationships, profile, attendance, training and performance history.
- **G. Departments:** list and detail, with head, team and KPIs (on track or off track).
- **H. Peers:** peer supervisors, their regions, relationship type and regional comparison.
- **I. Calendar:** 90 days, starting on Day 1 (Sunday 3 January 2027), with day, week and month views. Later days are locked.

**Analytics:** pure, unit-tested indicator, status, attention and performance-index functions.

**Quality**
- Typecheck, lint and build all clean.
- Vitest: 66/66, including PostgreSQL integration and RLS.
- Playwright: 83 passed and 1 skipped (by design) in both demo and Postgres modes.
- Details are in `TEST_RESULTS.md`.

## Not completed or not verified

- **Live Supabase is untested.** Sign-in, session refresh and the Supabase data source are written
  but have not run against a real project, because no credentials were available.
- **No account management.** Sprint 1 has no sign-up or user-management screens. Linking an auth user to the organisation is
  done with `link_auth_user()` in SQL (see the README).
- **No AI simulation or scenario engine.** The calendar shows Day 1 only. Decisions, scenario events, character
  memory, Leadership DNA and coaching exist only as schema and type contracts. Nothing generates or
  writes them yet.
- **Read-only.** There are no client write paths in Sprint 1 (no RLS write policies), by design.
- **Rare hydration warning.** Under heavy parallel test load, about 1 in 150 page loads logs a hydration warning. The page recovers
  on its own. See `TEST_RESULTS.md`.
- **Limited browser coverage.** Only Chromium has been run, and there has been no screen-reader audit.

## Sprint 2 recommendations

1. **Make Supabase live.**
   - Create the project and apply the migrations and seed.
   - Run the E2E suite in `supabase` mode.
   - Add a small admin script that links a new auth user to the organisation.
2. **Build the day loop.**
   - Advance `simulation_sessions.current_day`.
   - Write `simulation_days` state.
   - Add a deterministic engine that turns decisions into metric and relationship deltas, with unit tests like the analytics engine.
3. **Add scenario events.**
   - Write scenarios as data: the trigger, the affected branch or people, and the options.
   - Mark everything they produce as `scenario_generated`.
   - Keep the rule *AI proposes, deterministic engines decide*: an LLM may draft dialogue and
     options, but outcomes come from tested code.
4. **Record decisions and Leadership DNA.**
   - Record every player decision with its context.
   - Derive leadership-style scores into `leadership_assessments`.
   - Fill the player's empty profile from these scores.
5. **Give characters memory.** Store per-character memories of interactions that later scenarios can read. This would make the
   rivalry with Khalid and the collaboration with Noura matter.
6. **Add coaching plans.** Let the player create plans for Branch Leaders and track them across days.
7. **Harden quality.**
   - Find the cause of the intermittent hydration warning.
   - Add Firefox and WebKit to Playwright.
   - Run an axe accessibility check in E2E.
   - Add CI (GitHub Actions) that runs lint, typecheck, Vitest with a Postgres service, and Playwright.
