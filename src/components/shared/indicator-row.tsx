import type { IndicatorStatus } from "@/domain/common";
import { cn } from "@/lib/utils";

/** Labelled horizontal meter with optional area-average marker. */
export function IndicatorRow({
  label,
  value,
  display,
  status,
  min = 0,
  max = 100,
  marker,
  markerLabel,
}: {
  label: string;
  value: number;
  display: string;
  status: IndicatorStatus;
  min?: number;
  max?: number;
  marker?: number;
  markerLabel?: string;
}) {
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{display}</span>
      </div>
      <div className="bg-muted relative h-1.5 rounded-full">
        <div
          className={cn("absolute inset-y-0 start-0 rounded-full", status === "good" ? "bg-good" : status === "watch" ? "bg-watch" : "bg-critical")}
          style={{ width: `${pct(value)}%` }}
        />
        {marker !== undefined && (
          <div className="bg-foreground/60 absolute -top-1 h-3.5 w-0.5 rounded" style={{ insetInlineStart: `calc(${pct(marker)}% - 1px)` }} title={markerLabel} />
        )}
      </div>
    </div>
  );
}
