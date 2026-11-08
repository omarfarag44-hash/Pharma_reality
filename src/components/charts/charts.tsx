"use client";

/**
 * Recharts visualisations. Charts receive pre-calculated, pre-labelled data from
 * server components; they contain no business logic.
 * Categorical palette (validated for CVD separation & contrast): A #008f8a, B #5b6fd6, C #b8750f.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { GROUP_COLORS, NEUTRAL_COLOR as NEUTRAL } from "./palette";
const GRID = "#e5e9ee";
const AXIS = { fontSize: 11, fill: "#6b7785" };

function ChartTooltip({ active, payload, label, rows }: { active?: boolean; payload?: Array<{ payload: Record<string, unknown> }>; label?: string; rows: (p: Record<string, unknown>) => Array<[string, string]> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload;
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-semibold">{String(p.tooltipTitle ?? label ?? "")}</div>
      {rows(p).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-medium tabular-nums">{v}</span>
        </div>
      ))}
    </div>
  );
}

export interface AchievementDatum {
  code: string;
  short: string;
  achievement: number;
  group: string;
  tooltipTitle: string;
  achievementLabel: string;
  salesLabel: string;
}

export function BranchAchievementChart({ data, labels, height = 280 }: { data: AchievementDatum[]; labels: { achievement: string; sales: string }; height?: number }) {
  const max = Math.max(120, ...data.map((d) => Math.ceil(d.achievement / 10) * 10));
  return (
    <div dir="ltr" style={{ height }} role="img" aria-label={labels.achievement}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap={6}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="short" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} interval={0} />
          <YAxis domain={[60, max]} tick={AXIS} tickLine={false} axisLine={false} unit="%" width={48} allowDataOverflow />
          <ReferenceLine y={100} stroke={NEUTRAL} strokeDasharray="4 4" />
          <Tooltip
            cursor={{ fill: "rgba(100,116,139,0.08)" }}
            content={<ChartTooltip rows={(p) => [[labels.achievement, String(p.achievementLabel)], [labels.sales, String(p.salesLabel)]]} />}
          />
          <Bar isAnimationActive={false} dataKey="achievement" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((d) => (
              <Cell key={d.code} fill={GROUP_COLORS[d.group] ?? NEUTRAL} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface SalesDatum {
  month: string;
  target: number;
  actual: number;
  isCurrent: boolean;
  tooltipTitle: string;
  targetLabel: string;
  actualLabel: string;
  achievementLabel: string;
  provenanceLabel: string;
}

export function SalesTrendChart({
  data,
  labels,
  color = GROUP_COLORS.A!,
  height = 260,
}: {
  data: SalesDatum[];
  labels: { target: string; actual: string; achievement: string; provenance: string };
  color?: string;
  height?: number;
}) {
  return (
    <div dir="ltr" style={{ height }} role="img" aria-label={`${labels.actual} / ${labels.target}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
          <Tooltip
            cursor={{ fill: "rgba(100,116,139,0.08)" }}
            content={
              <ChartTooltip
                rows={(p) => [
                  [labels.actual, String(p.actualLabel)],
                  [labels.target, String(p.targetLabel)],
                  [labels.achievement, String(p.achievementLabel)],
                  [labels.provenance, String(p.provenanceLabel)],
                ]}
              />
            }
          />
          <Bar isAnimationActive={false} dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((d) => (
              <Cell key={d.month} fill={color} fillOpacity={d.isCurrent ? 1 : 0.45} />
            ))}
          </Bar>
          <Line isAnimationActive={false} type="monotone" dataKey="target" stroke={NEUTRAL} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: NEUTRAL }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface SeriesDatum {
  label: string;
  value: number;
  tooltipTitle: string;
  valueLabel: string;
}

export function SingleLineChart({ data, name, color = GROUP_COLORS.B!, height = 200, unit, domain }: { data: SeriesDatum[]; name: string; color?: string; height?: number; unit?: string; domain?: [number | "auto", number | "auto"] }) {
  return (
    <div dir="ltr" style={{ height }} role="img" aria-label={name}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={56} allowDecimals={false} tickFormatter={(v: number) => `${Math.round(v).toLocaleString("en")}${unit ?? ""}`} domain={domain ?? ["auto", "auto"]} />
          <Tooltip content={<ChartTooltip rows={(p) => [[name, String(p.valueLabel)]]} />} />
          <Line isAnimationActive={false} type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface RegionDatum {
  name: string;
  achievement: number;
  isPlayer: boolean;
  tooltipTitle: string;
  achievementLabel: string;
  sourceLabel: string;
}

export function RegionComparisonChart({ data, labels, height = 220 }: { data: RegionDatum[]; labels: { achievement: string; source: string }; height?: number }) {
  return (
    <div dir="ltr" style={{ height }} role="img" aria-label={labels.achievement}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" domain={[70, 115]} tick={AXIS} tickLine={false} axisLine={false} unit="%" allowDataOverflow />
          <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={110} />
          <ReferenceLine x={100} stroke={NEUTRAL} strokeDasharray="4 4" />
          <Tooltip cursor={{ fill: "rgba(100,116,139,0.08)" }} content={<ChartTooltip rows={(p) => [[labels.achievement, String(p.achievementLabel)], [labels.source, String(p.sourceLabel)]]} />} />
          <Bar isAnimationActive={false} dataKey="achievement" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.isPlayer ? GROUP_COLORS.A : "#94a3b8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
