/**
 * Projects a simulation run onto the organisation dataset, so every existing
 * screen (dashboard, branches, people) shows the world as the player's
 * decisions have shaped it.
 *
 * - A branch whose current figures were changed by scenarios gets its current
 *   record replaced by one tagged `scenario_generated`. Untouched branches keep
 *   their `simulated_current` record. History is never changed.
 * - Trust between the player and a character is moved by the engine's deltas.
 * - Trust between two non-player characters is moved by relation effects (both directions).
 * - The session's current day and status follow the progress.
 */
import type { OrgDataset } from "@/domain/dataset";
import { METRIC_FIELDS } from "./types";
import { adjustMetrics, pairKey, trustOf, type SimulationRun } from "./engine";

export function applySimulation(d: OrgDataset, run: SimulationRun): OrgDataset {
  const { world, state } = run;
  const changed = (id: string) => {
    const delta = state.deltas.get(id);
    return !!delta && METRIC_FIELDS.some((f) => Math.abs(delta[f]) > 1e-9);
  };
  const touched = state.decisions.length > 0 || state.day > 1 || state.coaching.length > 0;

  const branchMetrics = d.branchMetrics.map((m) => {
    if (m.provenance !== "simulated_current" || !changed(m.branchId)) return m;
    return { ...m, ...adjustMetrics(m, state.deltas.get(m.branchId)), id: m.id, branchId: m.branchId, provenance: "scenario_generated" as const };
  });

  const bound = (v: number) => Math.max(-100, Math.min(100, Math.round(v)));
  const relationships =
    state.trust.size || state.relations.size
      ? d.relationships.map((r) => {
          const other = r.sourceId === world.playerId ? r.targetId : r.targetId === world.playerId ? r.sourceId : null;
          if (!other) {
            const shift = state.relations.get(pairKey(r.sourceId, r.targetId));
            return shift ? { ...r, trust: bound(r.trust + shift) } : r;
          }
          if (!state.trust.has(other)) return r;
          const shift = trustOf(world, state, other) - (world.baseTrust.get(other) ?? 50);
          return { ...r, trust: bound(r.trust + shift) };
        })
      : d.relationships;

  return {
    ...d,
    branchMetrics,
    relationships,
    simulation: {
      ...d.simulation,
      currentDay: state.day,
      status: state.completed ? "completed" : touched ? "active" : d.simulation.status,
    },
  };
}
