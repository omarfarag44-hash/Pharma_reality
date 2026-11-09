# Sprint 2 report — Pharma Reality

NEXUS PHARMACIES is fictional. All identities, figures and situations are synthetic.

## Completed

**Day loop** (`src/lib/simulation/engine.ts`)
- The simulation is now playable: each weekday brings 1–3 situations, Friday and Saturday are the weekend, and the player ends each day to move on. Day 90 ends the simulation.
- The engine is pure and deterministic. The world is a function of the seeded organisation plus the player's saved progress, replayed day by day:
  generate the day's situations → apply recorded decisions → start coaching plans → close the day (open situations count as "not handled", coaching progresses).
- Rule kept from Sprint 1: *AI proposes, deterministic engines decide.* There is no AI in this sprint; every outcome comes from tested code.

**Scenarios as data** (`src/lib/simulation/scenarios.ts`)
- 16 bilingual scenario templates: stock-outs, near-expiry stock, lateness, a viral complaint, audit gaps, dispensing near-misses, staffing gaps, a loyalty campaign, the Thursday review, a CEO visit, and stakeholder stories with Khalid, Noura and Faisal.
- Each template defines who is involved, how its branch is chosen from live data (e.g. the branch with the lowest stock), 2–3 options and what happens if it is ignored.
- Effects: branch metrics (sales, stock, compliance, CSAT, near-expiry, slow-moving), trust, character memories and story flags.
- Follow-up scenarios depend on earlier choices: complaining about Khalid brings a public challenge later; borrowing stock from Noura means she asks for it back; hiding a near-miss gets discovered.

**Decisions and consequences**
- Every decision records its applied effects (before → after), shown on the card, in the decision log and on the branch page.
- Changed branch figures flow into the existing dashboard, branch directory and branch pages. A changed current record is tagged `scenario_generated` ("Changed by your decisions"); history is never altered.
- People-led options (coaching a leader rather than acting yourself) are stronger when that leader trusts you (×1.25 at trust ≥ 65, ×0.75 below 35).

**Leadership DNA** (`src/lib/simulation/leadership.ts`)
- Six dimensions: results, people development, integrity & compliance, customer focus, collaboration and decisiveness. Scores are 0–100 with 50 as neutral and do not saturate over a long game.
- A dominant style appears after 3 decisions. Shown on the new Leadership DNA page and on the player's own profile, which was empty in Sprint 1.

**Character memory**
- Characters remember interactions, commitments, grievances and recognition. Memories show on each person's profile with their trust in you (Day 1 vs now) and on scenario cards whenever that person is involved again.

**Coaching plans**
- One-week plans with a Branch Leader on one focus area (stock, compliance, CSAT, sales or expiry). Up to 3 active plans, one per branch. Each day improves the branch a little (more with higher trust); completion adds trust and a memory.

**Screens**
- New: Today (`/today`), Leadership DNA (`/leadership`), Coaching plans (`/coaching`).
- Updated: dashboard "Today's situations" card, header day badge links to Today, calendar marks decision days and links the current day, branch page "Situations at this branch", person page memories/trust or the player's DNA.
- Arabic RTL and English, phone layout included. Forms are plain server actions, so they work without JavaScript.

**Quality**
- Typecheck and lint clean, production build passes.
- Vitest: 84/84 (22 new simulation tests: determinism, weekends, ignored situations, bounds, overlay integrity, memories and follow-ups, coaching, DNA, progress cookie).
- Playwright (demo mode): 110 passed, 2 skipped by design. New day-loop flows in English, Arabic and on a phone.
- GitHub Actions CI added (`.github/workflows/ci.yml`): lint, typecheck, unit tests, build and Playwright.

## Where progress is stored

Progress is a small cookie (`PR_SIM`, under 3 KB after a full 90 days) holding only the day, the chosen options and the coaching plans. Everything else is recomputed by the engine on each request. This works on Vercel in demo mode with no database. Malformed or tampered values are dropped, and every decision is re-checked against the scenarios the engine actually generated.

## Not completed

- **Database persistence.** Progress is not yet written to `simulation_sessions`, `decisions`, `scenario_events`, `character_memories`, `leadership_assessments` or `coaching_plans`. That needs RLS write policies and a live Supabase project to test against. The engine output already matches those table shapes.
- **Live Supabase** is still untested (no credentials).
- **AI dialogue.** Scenario text is hand-written. An LLM could later draft variations; outcomes must stay in the engine.
- Firefox/WebKit, axe accessibility checks and the rare Sprint 1 hydration warning are still open.

## Sprint 3 suggestions

1. Make Supabase live and persist progress to the reserved tables (one row per decision, with `applied_effects`).
2. Weekly and monthly summaries: a Thursday report card and a month-end review against targets.
3. More scenario templates and multi-step stories; let character personality (already in profiles) change how people react.
4. Use AI to draft scenario variants and dialogue, keeping outcomes deterministic.
5. Accessibility audit and cross-browser runs in CI.
