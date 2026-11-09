import { Info } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export function ProvenanceLegend({ dict }: { dict: Dictionary }) {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs" data-testid="provenance-legend">
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="bg-chart-2 inline-block h-2.5 w-4 rounded-sm opacity-60" />
        {dict.common.provenance.synthetic_historical}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="bg-chart-1 inline-block h-2.5 w-4 rounded-sm" />
        {dict.common.provenance.simulated_current}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="inline-block h-2.5 w-4 rounded-sm border border-dashed border-current" />
        {dict.common.provenance.scenario_generated}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Info className="size-3.5" aria-hidden />
        {dict.common.provenanceNote}
      </span>
    </div>
  );
}
