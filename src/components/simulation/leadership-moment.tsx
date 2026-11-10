import Link from "next/link";
import type { Locale } from "@/domain/common";
import type { Dictionary } from "@/lib/i18n";
import type { LeadershipMoment } from "@/services/report-service";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const fitVariant = { matched: "good", close: "watch", mismatch: "critical", none: "muted" } as const;
const toneVariant = { appreciative: "good", accepting: "good", guarded: "muted", resistant: "watch", hurt: "critical" } as const;

/** One Situational Leadership evaluation: diagnosis, style used, fit and the person's reaction. */
export function LeadershipMomentItem({ m, dict, locale, showDay }: { m: LeadershipMoment; dict: Dictionary; locale: Locale; showDay?: boolean }) {
  const s = dict.sl;
  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3 text-sm" data-testid="leadership-moment" data-fit={m.fit} data-level={m.level} data-style={m.style ?? ""}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {showDay && <Badge variant="muted">{dict.common.day} {m.day}</Badge>}
        <span className="font-medium">{m.title}</span>
        <Badge variant={fitVariant[m.fit]} className="ms-auto">{s.fit[m.fit]}</Badge>
      </div>
      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="bg-muted/50 rounded-md p-2">
          <dt className="text-muted-foreground">{s.diagnosed}</dt>
          <dd className="mt-0.5 font-medium">{s.levelName[m.level]}</dd>
          <dd className="text-muted-foreground mt-0.5">{s.levelHint[m.level]}</dd>
        </div>
        <div className="bg-muted/50 rounded-md p-2">
          <dt className="text-muted-foreground">{s.yourStyle}</dt>
          <dd className="mt-0.5 font-medium">{m.style ? s.styleName[m.style] : s.fit.none}</dd>
          {m.style && <dd className="text-muted-foreground mt-0.5">{s.styleHint[m.style]}</dd>}
        </div>
      </dl>
      <p className="text-xs" data-testid="leadership-diagnosis">
        <Link href={`/${locale}/people/${m.subject.id}`} className="hover:underline">{m.diagnosis}</Link>
      </p>
      <p className={cn("text-xs leading-relaxed", m.fit === "matched" ? "text-good" : m.fit === "mismatch" ? "text-critical" : "")} data-testid="leadership-explanation">
        {m.explanation}
      </p>
      {m.reaction && (
        <div className="flex flex-col gap-1.5 border-t pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={toneVariant[m.reaction.tone]}>{s.tone[m.reaction.tone]}</Badge>
            <span className="italic">«{m.reaction.line}»</span>
          </div>
          {m.reaction.reasons.length > 0 && (
            <div>
              <span className="text-muted-foreground">{s.whyReaction}: </span>
              <ul className="mt-1 flex flex-wrap gap-1">
                {m.reaction.reasons.map((r, i) => (
                  <li key={i}>
                    <Badge variant={r.key === "low_stability" ? "watch" : r.positive ? "good" : "critical"}>
                      {r.key === "low_stability" ? "" : r.positive ? "+ " : "− "}
                      {s.reason[r.key as keyof typeof s.reason] ?? r.key}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
