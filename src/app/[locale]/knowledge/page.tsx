import Link from "next/link";
import { BookOpen } from "lucide-react";
import { fmt } from "@/lib/i18n";
import { pageContext } from "@/lib/page";
import { KNOWLEDGE, type SourceKind } from "@/lib/knowledge/frameworks";
import { SCENARIOS } from "@/lib/simulation/scenarios";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const KINDS: SourceKind[] = ["research", "framework", "teaching"];
const evidenceVariant = { strong: "good", moderate: "secondary", mixed: "watch", limited: "muted" } as const;

export default async function KnowledgePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, dict } = await pageContext(params);
  const k = dict.knowledge;
  const rawKind = (await searchParams).kind;
  const kind = KINDS.find((x) => x === rawKind) ?? null;
  const entries = kind ? KNOWLEDGE.filter((e) => e.kind === kind) : KNOWLEDGE;
  const scenarioTitle = new Map(SCENARIOS.map((s) => [s.key, s.title[locale]]));
  const feature: Record<string, string> = {
    "character-engine": locale === "ar" ? "محرك الشخصيات" : "Character Engine",
    "leadership-dna": dict.sim.dnaTitle,
    "coaching-plans": dict.sim.coachingTitle,
    "end-of-day-report": locale === "ar" ? "تقرير نهاية اليوم" : "End-of-day report",
  };

  return (
    <>
      <PageHeader title={k.title} description={k.subtitle} />
      <p className="text-muted-foreground mb-4 flex items-start gap-2 text-xs">
        <BookOpen className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {k.note}
      </p>
      <nav className="mb-4 flex flex-wrap gap-2" aria-label={k.title}>
        {[null, ...KINDS].map((x) => (
          <Link
            key={x ?? "all"}
            href={x ? `/${locale}/knowledge?kind=${x}` : `/${locale}/knowledge`}
            className={cn("rounded-full border px-3 py-1 text-xs", kind === x ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}
            aria-current={kind === x ? "page" : undefined}
          >
            {x ? k.kind[x] : k.filterAll}
          </Link>
        ))}
        <span className="text-muted-foreground ms-auto self-center text-xs" data-testid="knowledge-count">{fmt(k.count, { n: entries.length })}</span>
      </nav>

      <ul className="grid gap-4 lg:grid-cols-2">
        {entries.map((e) => (
          <li key={e.id}>
            <Card className="h-full" data-testid="knowledge-entry" data-kind={e.kind} id={e.id}>
              <CardHeader className="gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{k.kind[e.kind]}</Badge>
                  <Badge variant={evidenceVariant[e.evidence]}>{k.evidence[e.evidence]}</Badge>
                </div>
                <CardTitle className="text-base leading-snug">{e.name[locale]}</CardTitle>
                <CardDescription>{e.summary[locale]}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div>
                  <h3 className="text-muted-foreground text-xs font-medium">{k.criteria}</h3>
                  <p className="mt-0.5 leading-relaxed">{e.criteria[locale]}</p>
                </div>
                <div>
                  <h3 className="text-muted-foreground text-xs font-medium">{k.recommendation}</h3>
                  <p className="mt-0.5">{e.recommendation[locale]}</p>
                </div>
                {e.caution && (
                  <p className="bg-watch-soft rounded-md p-2 text-xs">
                    <strong>{k.caution}: </strong>
                    {e.caution[locale]}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  <span className="text-muted-foreground me-1 text-xs">{k.competencies}:</span>
                  {e.competencies.map((c, i) => <Badge key={i} variant="secondary">{c[locale]}</Badge>)}
                </div>
                {e.usedIn.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-muted-foreground me-1 text-xs">{k.usedIn}:</span>
                    {e.usedIn.map((u) => <Badge key={u} variant="muted">{scenarioTitle.get(u) ?? feature[u] ?? u}</Badge>)}
                  </div>
                )}
                <details>
                  <summary className="text-muted-foreground cursor-pointer text-xs">{k.sources} ({e.sources.length})</summary>
                  <ul className="mt-2 flex flex-col gap-1.5 text-xs" dir="ltr">
                    {e.sources.map((s) => <li key={s} className="text-start">{s}</li>)}
                  </ul>
                </details>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
