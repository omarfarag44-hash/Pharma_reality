# Sprint 3A report: Character Engine, Situational Leadership, end-of-day report

## Scope

Sprint 3A covers the parts of the Sprint 3 brief that can be built without paid services.
There are no AI API calls: every reaction, line of dialogue and evaluation comes from tested rules.
Database persistence (free Supabase tier) waits for credentials and is not part of 3A.

## What was built

| Area | What it does | Where |
| --- | --- | --- |
| Unified Character Engine | One engine for every character, reading Big Five scores, motivators, stress triggers, communication style, skills, experience, trust and memories. It returns a tone (appreciative, accepting, guarded, resistant or hurt), changes to trust and commitment, a line of dialogue, and the reasons behind the reaction. | `src/lib/simulation/characters.ts` |
| Situational Leadership | D1–D4 is diagnosed **per task**, from the task's skills plus experience (competence) and from personality, performance, trust and recent events (commitment). The level is compared with the S1–S4 style the option expresses. The fit scales the business effect (×1.3 / ×1.0 / ×0.7 / ×0.5). | `characters.ts`, `engine.ts` (`diagnose`, `resolveScenario`) |
| New leadership situations | 9 new scenarios (codes 17–25), such as resisting feedback, lost confidence, a new hire's errors, refusing responsibility, a conflict between two pharmacists, a leader missing targets, roster approval, a branch visit, and the Operations Director questioning a decision. They run in a separate daily stream (at most one a day, with its own seed), so the Sprint 2 schedule and saved games stay the same. | `src/lib/simulation/scenarios-leadership.ts` |
| Relationships between characters | New `relation` and `commitment` effects. A decision can change how two colleagues relate to each other. The overlay moves NPC↔NPC relationship trust in both directions. | `engine.ts`, `overlay.ts` |
| Hidden evaluation | The character's reaction shows right after a decision. The style evaluation (level, style, fit and its explanation) only appears once the day is closed. | `report-service.ts` |
| End-of-day report | `/[locale]/report/[day]` shows: leadership behaviours observed, how people changed (trust and commitment), relationships between colleagues, open items (coaching plans and follow-ups), priorities for tomorrow, and every decision with its consequences. | `src/app/[locale]/report/[day]` |
| Morning briefing | On Today: a link to the last report, the number of situations, Thursday's review, coaching plans that end today, and branches over the attention threshold. | `today/page.tsx` |
| Leadership page | A Situational Leadership section with match rate, over-directing and under-supporting counts, the rate by week and by level, a pattern sentence, and recent leadership moments. It is built from closed days only. | `leadership/page.tsx` |
| Profiles | A "Development level by task" table (9 tasks), plus overall commitment. | `people/[id]/page.tsx` |
| Knowledge base | 20 entries, each with its kind (research finding, practical framework or teaching model), evidence level, APA citations, competencies, the scenarios that use it, how the simulation applies it, a recommendation, and a caution where the evidence is weak. | `src/lib/knowledge/frameworks.ts`, `/[locale]/knowledge` |

## Acceptance (PASS/FAIL)

| # | Requirement from the Sprint 3 brief | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Development level per task, not per person | PASS | Unit test "the same person has different development levels on different tasks". For example, one Branch Leader is D4 on sales and inventory, D3 on clinical and D1 on leadership. The profile table is tested in e2e. |
| 2 | S1–S4 matched against D1–D4 | PASS | Unit tests for `styleGap` and `fitFactor`. The branch_visit test checks that each style produces base × fit. |
| 3 | No quiz, and no ideal answer revealed before acting | PASS | Option text never names a style. The e2e test checks there is no `leadership-moment` on Today, before or after deciding. The `slSummary` unit test checks that only closed days count. |
| 4 | Characters react according to their personality and history | PASS | Unit tests: a micromanagement trigger lowers the score, low emotional stability amplifies negatives, and grievances lower the score by 2. For resisting_feedback, the S1..S4 tones are hurt, accepting, appreciative and accepting. |
| 5 | Memory persists and is linked to its source | PASS | T8 (updated): every memory traces back to an option effect or a Character Engine reaction. Replay is identical. |
| 6 | Decisions change relationships between characters | PASS | pharmacist_conflict moves relation 30 to 36 when coached and 30 to 22 when ignored, and the overlay changes the dataset relationship. (The Sprint 2 validation recorded this as a known gap.) |
| 7 | End-of-day reflection | PASS | The report page is covered by e2e (English and Arabic) and is reachable from the briefing and the calendar. |
| 8 | Leadership tracking over time | PASS | Match rate by week and by level, plus a pattern sentence. |
| 9 | Knowledge layer that separates research from teaching models | PASS | A unit test checks that every entry is bilingual, cited and linked to real scenarios, and that weak-evidence entries carry a caution. The e2e test checks the filter by kind. |
| 10 | Arabic, English and mobile | PASS | All new strings exist in both dictionaries. The responsive e2e covers `/knowledge` and `/report/1` in both locales on a Pixel 7 profile. |
| 11 | Baseline and final assessment | NOT YET | Planned for Sprint 3B, which needs persistence across devices. |
| 12 | Communication Center and Incident engine | NOT YET | Planned for Sprint 3B. |
| 13 | Database persistence | NOT YET | Waits for free Supabase credentials. Progress is still the `PR_SIM` cookie. |

## What is real and what is simulated

- **Real (computed by tested code):**
  - Development levels, style fit, reactions, trust, commitment, relationships, memories, metric changes, the report and the match rates.
  - All of it is deterministic: the same decisions always give the same world.
- **Simulated (fictional data):**
  - Every person, branch, skill rating and personality score comes from the seed generator.
  - Dialogue lines are templates (6 communication styles × 5 tones). They are not generated text.
- **Not claimed:**
  - The Situational Leadership matching rule is a **teaching model** with mixed evidence (Graeff, 1997; Thompson & Vecchio, 2009). The knowledge base says so.

## Test results

- Unit: 102 passed, 4 skipped (`npx vitest run`).
- E2E: 132 passed, 2 skipped (`npx playwright test --trace off`).
- Lint, typecheck and production build pass.
