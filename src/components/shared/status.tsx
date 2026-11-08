import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { IndicatorStatus } from "@/domain/common";
import type { Dictionary } from "@/lib/i18n";
import type { TrendDirection } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, dict, className }: { status: IndicatorStatus; dict: Dictionary; className?: string }) {
  const label = status === "good" ? dict.common.status_good : status === "watch" ? dict.common.status_watch : dict.common.status_critical;
  return (
    <Badge variant={status} className={className} data-status={status}>
      <span aria-hidden className={cn("size-1.5 rounded-full", status === "good" ? "bg-good" : status === "watch" ? "bg-watch" : "bg-critical")} />
      {label}
    </Badge>
  );
}

export function statusText(status: IndicatorStatus) {
  return status === "good" ? "text-good" : status === "watch" ? "text-[oklch(0.55_0.13_65)]" : "text-critical";
}

export function StatusDot({ status, label }: { status: IndicatorStatus; label?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn("inline-block size-2 shrink-0 rounded-full", status === "good" ? "bg-good" : status === "watch" ? "bg-watch" : "bg-critical")}
    />
  );
}

/** Direction arrow; `goodWhenUp` controls colouring. Arrows are mirrored-safe (not flipped in RTL on purpose). */
export function TrendIndicator({ direction, label, goodWhenUp = true }: { direction: TrendDirection; label: string; goodWhenUp?: boolean }) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : ArrowRight;
  const good = direction === "flat" ? null : (direction === "up") === goodWhenUp;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", good === null ? "text-muted-foreground" : good ? "text-good" : "text-critical")}>
      <Icon className="size-3.5 rtl:-scale-x-100" aria-hidden />
      {label}
    </span>
  );
}
