import Link from "next/link";
import { ArrowDown, ArrowUp, Building2, Minus } from "lucide-react";
import type { Locale } from "@/domain/common";
import type { Dictionary } from "@/lib/i18n";
import { decide } from "@/lib/simulation/actions";
import type { EffectView, ScenarioView } from "@/services/simulation-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const severityVariant = { low: "muted", medium: "watch", high: "critical", critical: "critical" } as const;

export function TrustValue({ value }: { value: number }) {
  return (
    <span className={cn("tabular-nums font-medium", value >= 60 ? "text-good" : value < 30 ? "text-critical" : "")} dir="ltr">
      {value}
    </span>
  );
}

export function EffectList({ effects, dict }: { effects: EffectView[]; dict: Dictionary }) {
  if (!effects.length) return null;
  return (
    <ul className="flex flex-col gap-1.5 text-xs" data-testid="effects">
      {effects.map((e, i) => {
        const Icon = e.direction === "up" ? ArrowUp : e.direction === "down" ? ArrowDown : Minus;
        return (
          <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Icon className={cn("size-3.5 shrink-0", e.direction === "flat" ? "text-muted-foreground" : e.positive ? "text-good" : "text-critical")} aria-hidden />
            <span className="font-medium">{dict.sim.field[e.field]}</span>
            <span className="text-muted-foreground">·</span>
            {e.targetHref ? (
              <Link href={e.targetHref} className={cn("hover:underline", e.kind === "metric" && "ltr-nums")}>{e.target}</Link>
            ) : (
              <span>{dict.sim.areaWide}</span>
            )}
            <span className="ms-auto tabular-nums" dir="ltr">
              {e.change ?? (
                <>
                  {e.before} → <strong className={e.positive ? "text-good" : "text-critical"}>{e.after}</strong>
                </>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function ScenarioCard({ view, dict, locale, interactive }: { view: ScenarioView; dict: Dictionary; locale: Locale; interactive: boolean }) {
  const t = dict.sim;
  const decided = view.decision;
  return (
    <Card id={view.id} data-testid="scenario" data-scenario={view.template.key} data-state={decided ? "decided" : "pending"} className={cn("scroll-mt-20", !decided && "border-primary/40")}>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={severityVariant[view.template.severity]}>{t.severity[view.template.severity]}</Badge>
          <Badge variant="outline">{t.category[view.template.category]}</Badge>
          {view.branch && (
            <Link href={`/${locale}/branches/${view.branch.code}`} className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline">
              <Building2 className="size-3.5" aria-hidden />
              <span className="ltr-nums">{view.branch.code}</span> · {view.branch.name[locale]}
            </Link>
          )}
        </div>
        <CardTitle className="text-base leading-snug">{view.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <p className="leading-relaxed">{view.narrative}</p>

        {view.people.length > 0 && (
          <div>
            <h3 className="text-muted-foreground mb-2 text-xs font-medium">{t.involved}</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {view.people.map((p) => (
                <li key={p.employee.id} className="rounded-lg border p-2.5 text-xs" data-testid="scenario-person">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/${locale}/people/${p.employee.id}`} className="truncate font-medium hover:underline">{p.employee.fullName[locale]}</Link>
                    <span className="text-muted-foreground shrink-0">
                      {t.trustInYou} <TrustValue value={p.trust} />
                    </span>
                  </div>
                  <div className="text-muted-foreground truncate">{p.employee.jobTitle[locale]}</div>
                  {p.memories.length > 0 && (
                    <ul className="mt-1.5 flex flex-col gap-1 border-t pt-1.5" data-testid="scenario-memory">
                      {p.memories.map((m, i) => (
                        <li key={i} className="leading-snug">
                          <span className={cn("font-medium", m.type === "grievance" ? "text-critical" : m.type === "recognition" ? "text-good" : "")}>{t.memoryType[m.type]}:</span> {m.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!decided && interactive && (
          <div className="flex flex-col gap-2" data-testid="scenario-options">
            {view.options.map((o) => (
              <form key={o.index} action={decide}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="scenario" value={view.id} />
                <input type="hidden" name="option" value={o.index} />
                <Button type="submit" variant="outline" className="h-auto min-h-10 w-full justify-start py-2 text-start whitespace-normal" data-testid="scenario-option">
                  <span className="bg-muted text-muted-foreground grid size-5 shrink-0 place-items-center rounded text-[11px] font-semibold">{o.index + 1}</span>
                  {o.label}
                </Button>
              </form>
            ))}
          </div>
        )}

        {decided && (
          <div className="bg-muted/50 flex flex-col gap-2 rounded-lg p-3" data-testid="scenario-outcome">
            <div className="text-xs">
              <span className="text-muted-foreground">{t.yourChoice}: </span>
              <strong>{decided.label ?? t.ignoredLabel}</strong>
            </div>
            <p className="leading-relaxed">{decided.outcome}</p>
            <EffectList effects={decided.effects} dict={dict} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
