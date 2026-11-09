# Architecture — Pharma Reality (Sprints 1–2)

> NEXUS PHARMACIES is a **fictional** company. Every person, branch, number and
> relationship is synthetic and generated from a fixed seed. It does not represent
> any real pharmacy chain's organisation.

## Layers

```
app/[locale]/*  (server components, RTL/LTR)      ← pages, no data access of their own
   │
services/*      (branch, people, org, dashboard)   ← view models, joins, sorting
   │
lib/analytics   (pure functions, unit-tested)      ← indicators, statuses, indices
   │
data/repository (OrgRepository interface)          ← one API, three sources
   │
data/sources    demo | postgres | supabase         ← each produces an OrgDataset
   │
validation/*    (Zod + integrity rules)            ← every dataset is checked on load
```

- **Domain** (`src/domain`) holds the types only: organisation, people, branches,
  simulation contracts and catalogues (bilingual labels).
- **Pages** call `pageContext()` and services; they never touch SQL or Supabase directly.
- **Client components** (`filter-bar`, `org-chart`, charts, language switch) only edit the URL
  or local UI state. All filtering happens on the server from the query string, so
  filtered views can be shared and render without JavaScript.

## Data sources and modes

`resolveEnv()` (`src/lib/env.ts`) chooses the mode:

| Mode | Trigger | Source | Auth |
|---|---|---|---|
| `demo` | no credentials, `PHARMA_DATA_MODE=demo`, or invalid/missing vars for the requested mode | `generateDataset()` in memory | none |
| `postgres` | `DATABASE_URL` (or `PHARMA_DATA_MODE=postgres`) | `pg` pool, server-only | none (internal/dev) |
| `supabase` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (wins in `auto`) | PostgREST as the signed-in user | Supabase Auth + RLS |

`PHARMA_DATA_MODE` defaults to `auto`.

When the configuration is incomplete, the app does not crash. It falls back to demo mode and shows a
banner. Only the anon key ever reaches the browser. `DATABASE_URL` and the
service-role key are read in `server-only` modules.

Every source returns the same `OrgDataset`. `rows.ts` maps it to and from table rows.
The round trip (`fromRows(toRows(d)) == d`) is unit-tested, and it is also tested against real
PostgreSQL. `DatasetRepository` implements `OrgRepository` over the dataset. It is cached
per request with React `cache()`.

## Seed

`src/data/seed/generator.ts` builds the whole organisation deterministically. It uses a
cyrb128 hash and a sfc32 PRNG keyed per entity, and `stableUuid` for IDs. `SEED_VERSION =
nexus-sprint1-v1`. Changing one branch therefore does not reshuffle everything else.
`npm run db:seed:generate` writes `supabase/seed.sql` from that same generator, so the
demo, Postgres and Supabase modes show identical data.

**Shape:**
- 1 CEO and 1 Operations Director.
- The player (Area Supervisor, Central) and 3 peer supervisors.
- 15 branches, each with 4 staff (1 Branch Leader). Groups A/B/C hold 5 branches each.
- 8 departments, each with a head and members.
- **Totals:** 96 employees, 99 reporting lines and 99 relationships.

## Data provenance

Every metric row carries a `provenance` value:

| Value | Meaning | Where |
|---|---|---|
| `synthetic_historical` | invented back-story (Jun–Nov 2026) | `metric_snapshots`, `branch_metrics` history |
| `simulated_current` | the state on Day 1 (Dec 2026 closing month) | `branch_metrics` |
| `scenario_generated` | reserved for Sprint 2+ scenario output | not yet produced |

The UI shows a provenance legend wherever history is plotted next to current values.

## Database (`supabase/migrations`)

1. **`core_schema`**
   - Tables: organizations, users, roles, regions, departments, department_kpis, branches,
     employees, employee_profiles, employee_skills, performance_reviews, attendance_records,
     training_records, reporting_lines, relationships, branch_metrics, metric_snapshots and audit_logs.
   - CHECK constraints for ranges and enums.
   - Partial unique indexes (one leader per branch, one player, one solid-line manager per person).
   - Deferred circular foreign keys (department head ↔ employee).
   - `updated_at` triggers and an `audit_row_change` trigger that writes to `audit_logs`.
2. **`simulation_foundation`**
   - Tables: simulation_sessions and simulation_days. `generate_simulation_days()` creates the
     90-day calendar.
   - Reserved tables: scenario_events, decisions, character_memories,
     leadership_assessments and coaching_plans. The schema exists; no engine writes to it yet.
3. **`row_level_security`**
   - RLS is enabled on every table. `current_organization_id()` resolves the
     signed-in user's organisation through `users.auth_user_id`.
   - Authenticated users get read-only policies scoped to their organisation. Anonymous users get nothing.
   - `link_auth_user()` binds a Supabase Auth account to an organisation user.
   - There are no client write policies in Sprint 1.

## Simulation calendar

`buildCalendar()` (`src/lib/simulation/calendar.ts`) runs 90 days from 2027-01-03 (a Sunday).
The weekend is Friday and Saturday. The calendar has 13 weeks and three 30-day periods. Only Day 1 is active. Later days are
locked and shown as such.

## Analytics engine (`src/lib/analytics`)

These are pure, deterministic functions with no I/O:
- target achievement
- stock, compliance, CSAT and attendance indicators
- slow-moving and near-expiry percentages
- indicator status from thresholds (good, watch or critical)
- the attention score: critical = 3, watch = 1, flagged at ≥ 4
- a weighted performance index (achievement 0.35, compliance 0.2, stock 0.15, CSAT 0.1, attendance 0.1, expiry 0.05, slow-moving 0.05)
- group and regional aggregation

## Future engines (not implemented)

Sprint 1 ships **no AI and no simulation engine**. The intended principle for later sprints:

> **AI proposes, deterministic engines decide.**

A language model may draft dialogue, character reactions or scenario text. Outcomes
are computed by deterministic, testable engines from recorded decisions:
- metric effects
- relationship deltas
- Leadership DNA scoring

AI output is stored with provenance `scenario_generated`. The reserved tables above are the contracts for
that work (`src/domain/simulation.ts`).

## i18n

- Routes are `/ar/*` (the default, RTL) and `/en/*` (LTR). The middleware redirects bare paths
  and remembers the choice in the `PR_LOCALE` cookie.
- Dictionaries are typed: `ar.ts` must match the shape of `en.ts`.
- Numbers and codes are wrapped in LTR isolates inside RTL text.

## Simulation engine (Sprint 2)

```
cookie PR_SIM (day, choices, coaching)  ──►  runSimulation(world, progress)   src/lib/simulation/engine.ts
                                                 │  replays day by day using SCENARIOS (data)
                                                 ▼
                                   SimState: metric deltas, trust, memories,
                                   decisions, Leadership DNA points, coaching
                                                 │
                       applySimulation(dataset)  ▼  src/lib/simulation/overlay.ts
                                   OrgDataset as the player's decisions changed it
                                                 │
                                   DatasetRepository → existing services and pages
```

- `getSimulation()` and `getRepository()` (`src/data/repository/index.ts`) are cached per request. The repository now returns the overlaid dataset, so every Sprint 1 screen shows the simulated world.
- Server actions in `src/lib/simulation/actions.ts` validate against the replayed run, update the cookie and redirect.
- Scenario `code`s and option order are part of saved progress: append new templates/options, never renumber or reorder.
- See `docs/SPRINT2_REPORT.md` for content and rules.
