import type { Department } from "@/domain/organization";
import type { Locale } from "@/domain/common";
import type { Dictionary } from "@/lib/i18n";
import { formatNumber } from "@/lib/i18n/format";
import { kpiOnTrack } from "@/services/org-service";
import { StatusBadge } from "@/components/shared/status";

export function KpiList({ kpis, locale, dict }: { kpis: Department["kpis"]; locale: Locale; dict: Dictionary }) {
  const unit = (u: Department["kpis"][number]["unit"]) => dict.departments.units[u];
  const show = (v: number, u: Department["kpis"][number]["unit"]) => `${formatNumber(v, locale, Number.isInteger(v) ? 0 : 1)}${u === "percent" ? unit(u) : unit(u) ? ` ${unit(u)}` : ""}`;
  return (
    <ul className="flex flex-col gap-2" data-testid="kpi-list">
      {kpis.map((k) => (
        <li key={k.code} className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm">
          <div className="min-w-0">
            <div className="truncate">{k.name[locale]}</div>
            <div className="text-muted-foreground text-xs">
              {dict.departments.targetLabel}: <span className="tabular-nums">{show(k.target, k.unit)}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-semibold tabular-nums">{show(k.current, k.unit)}</span>
            <StatusBadge status={kpiOnTrack(k) ? "good" : "watch"} dict={dict} />
          </div>
        </li>
      ))}
    </ul>
  );
}
