import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, Building2, Mail, Phone } from "lucide-react";
import {
  CAREER_ASPIRATIONS,
  catalogLabel,
  COMMUNICATION_STYLES,
  COMPETENCIES,
  CONFLICT_APPROACHES,
  DECISION_STYLES,
  LEADERSHIP_STYLES,
  MOTIVATORS,
  STRESS_TRIGGERS,
  TRAINING_COURSES,
} from "@/domain/catalogs";
import { performanceBand } from "@/lib/analytics";
import { fmt } from "@/lib/i18n";
import { formatDate, formatNumber, formatPercent } from "@/lib/i18n/format";
import { pageContext } from "@/lib/page";
import { getPersonDetail } from "@/services/people-service";
import { getSimulation } from "@/data/repository";
import { trustOf } from "@/lib/simulation/engine";
import { leadershipDna } from "@/lib/simulation/leadership";
import { DNA_DIMENSIONS } from "@/lib/simulation/types";
import { getSimIndex, memoriesOf } from "@/services/simulation-service";
import { TrustValue } from "@/components/simulation/scenario-card";
import { SingleLineChart } from "@/components/charts/charts";
import { PageHeader } from "@/components/shared/page-header";
import { PersonLink } from "@/components/shared/person-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const bandVariant = { exceptional: "good", strong: "good", solid: "secondary", developing: "watch", below: "critical" } as const;

function Meter({ value, max = 100, tone = "primary" }: { value: number; max?: number; tone?: "primary" | "good" | "critical" | "watch" }) {
  return <Progress value={(value / max) * 100} indicatorClassName={tone === "good" ? "bg-good" : tone === "critical" ? "bg-critical" : tone === "watch" ? "bg-watch" : "bg-primary"} />;
}

export default async function PersonPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const { locale, dict, repo } = await pageContext(params);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const person = await getPersonDetail(repo, id);
  if (!person) notFound();
  const [run, simIdx] = await Promise.all([getSimulation(), getSimIndex(repo)]);
  const memories = memoriesOf(run, id, simIdx, locale);
  const dna = person.employee.isPlayer ? leadershipDna(run.state) : null;
  const st = dict.sim;
  const { employee: e, profile: p } = person;
  const t = dict.profile;
  const L = (cat: Parameters<typeof catalogLabel>[0], code: string) => catalogLabel(cat, code)[locale];
  const band = p ? performanceBand(p.performanceScore) : null;

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="ltr-nums">{e.employeeCode}</span>
            {e.isBranchLeader && <Badge>{dict.common.leader}</Badge>}
            {e.isPlayer && <Badge>{dict.common.you}</Badge>}
            <Badge variant={e.employmentStatus === "active" ? "muted" : "watch"}>{t.statusLabel[e.employmentStatus]}</Badge>
          </span>
        }
        title={e.fullName[locale]}
        description={e.jobTitle[locale]}
        actions={
          p && band ? (
            <div className="text-end" data-testid="person-score">
              <div className="text-muted-foreground text-xs">{dict.employees.performance}</div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-2xl font-semibold tabular-nums">{p.performanceScore}</span>
                <Badge variant={bandVariant[band]}>{dict.bands[band].replace(/\s*\(.*\)/, "")}</Badge>
              </div>
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Professional profile */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t.professional}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 text-sm">
            {p && <p className="leading-relaxed">{p.summary[locale]}</p>}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground text-xs">{t.experience}</dt>
                <dd className="font-medium tabular-nums">{e.yearsOfExperience} {dict.common.years}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t.hired}</dt>
                <dd className="font-medium">{formatDate(e.hireDate, locale)}</dd>
              </div>
              {p && (
                <>
                  <div>
                    <dt className="text-muted-foreground text-xs">{t.leadershipPotential}</dt>
                    <dd className="font-medium">
                      {t.potential[p.leadershipPotential]} <span className="text-muted-foreground tabular-nums">({p.leadershipPotentialScore})</span>
                    </dd>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="text-muted-foreground text-xs">{t.career}</dt>
                    <dd className="font-medium">{L(CAREER_ASPIRATIONS, p.careerAspiration)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground text-xs">{t.communication}</dt>
                    <dd className="font-medium">{L(COMMUNICATION_STYLES, p.communicationStyle)}</dd>
                  </div>
                  {p.leadershipStyle && (
                    <div>
                      <dt className="text-muted-foreground text-xs">{t.leadershipStyle}</dt>
                      <dd className="font-medium">{L(LEADERSHIP_STYLES, p.leadershipStyle)}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
            {p && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-xs font-medium text-muted-foreground">{t.strengths}</h3>
                  <ul className="flex flex-wrap gap-1.5" data-testid="strengths">
                    {p.strengths.map((s) => (
                      <li key={s}><Badge variant="good">{L(COMPETENCIES, s)}</Badge></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-medium text-muted-foreground">{t.development}</h3>
                  <ul className="flex flex-wrap gap-1.5" data-testid="development">
                    {p.developmentAreas.map((s) => (
                      <li key={s}><Badge variant="watch">{L(COMPETENCIES, s)}</Badge></li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment & contact */}
        <Card>
          <CardHeader>
            <CardTitle>{t.branchAssignment}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {person.branch && (
              <Link href={`/${locale}/branches/${person.branch.code}`} className="hover:bg-muted/60 flex items-center gap-3 rounded-lg border p-3" data-testid="person-branch">
                <Building2 className="text-muted-foreground size-4" aria-hidden />
                <span>
                  <span className="ltr-nums text-muted-foreground block text-xs">{person.branch.code}</span>
                  <span className="font-medium">{person.branch.name[locale]}</span>
                </span>
              </Link>
            )}
            {person.department && (
              <Link href={`/${locale}/departments/${person.department.code}`} className="hover:bg-muted/60 flex items-center gap-3 rounded-lg border p-3">
                <Building2 className="text-muted-foreground size-4" aria-hidden />
                <span>
                  <span className="text-muted-foreground block text-xs">{dict.common.department}</span>
                  <span className="font-medium">{person.department.name[locale]}</span>
                </span>
              </Link>
            )}
            {person.region && (
              <div className="rounded-lg border p-3">
                <span className="text-muted-foreground block text-xs">{dict.common.region}</span>
                <span className="font-medium">{person.region.name[locale]}</span>
              </div>
            )}
            <div className="text-muted-foreground flex flex-col gap-1.5 text-xs">
              <span className="inline-flex items-center gap-2"><Mail className="size-3.5" aria-hidden /><span className="ltr-nums">{e.email}</span></span>
              {e.phoneExtension && <span className="inline-flex items-center gap-2"><Phone className="size-3.5" aria-hidden />{dict.common.extension} <span className="ltr-nums">{e.phoneExtension}</span></span>}
            </div>
            {person.teammates.length > 0 && (
              <div>
                <h3 className="text-muted-foreground mb-2 text-xs font-medium">{t.teammates}</h3>
                <div className="flex flex-col gap-2">
                  {person.teammates.map((m) => (
                    <PersonLink key={m.id} id={m.id} name={m.fullName} subtitle={m.jobTitle[locale]} locale={locale} highlight={m.isBranchLeader} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Reporting */}
        <Card>
          <CardHeader>
            <CardTitle>{t.reporting}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4" data-testid="reporting">
            <div>
              <h3 className="text-muted-foreground mb-2 text-xs font-medium">{t.managers}</h3>
              {person.managers.length === 0 ? (
                <p className="text-muted-foreground text-sm">—</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {person.managers.map((m) => (
                    <li key={`${m.employee.id}-${m.lineType}`} className="flex items-center justify-between gap-2">
                      <PersonLink id={m.employee.id} name={m.employee.fullName} subtitle={m.context ? m.context[locale] : m.employee.jobTitle[locale]} locale={locale} highlight={m.employee.isPlayer} />
                      <Badge variant={m.lineType === "solid" ? "secondary" : "outline"} className={cn(m.lineType === "dotted" && "border-dashed")}>
                        {m.lineType === "solid" ? dict.org.solid : dict.org.dotted}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {person.directReports.length > 0 && (
              <div>
                <h3 className="text-muted-foreground mb-2 text-xs font-medium">
                  {t.directReports} ({person.directReports.length})
                </h3>
                <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                  {person.directReports.map((m) => (
                    <li key={`${m.employee.id}-${m.lineType}`} className="flex items-center justify-between gap-2">
                      <PersonLink id={m.employee.id} name={m.employee.fullName} subtitle={m.employee.jobTitle[locale]} locale={locale} />
                      {m.lineType === "dotted" && <Badge variant="outline" className="border-dashed">{dict.org.dotted}</Badge>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle>{t.performanceHistory}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {person.reviews.length > 0 && (
              <SingleLineChart
                name={dict.common.score}
                height={160}
                domain={[40, 100]}
                data={person.reviews.map((r) => ({ label: r.period.replace("2026-", ""), value: r.score, tooltipTitle: r.period, valueLabel: String(r.score) }))}
              />
            )}
            <ul className="text-xs" data-testid="reviews">
              {person.reviews.map((r) => (
                <li key={r.id} className="flex justify-between border-b py-1.5 last:border-0">
                  <span className="text-muted-foreground ltr-nums">{r.period}</span>
                  <span className="text-muted-foreground">{dict.common.provenance[r.provenance]}</span>
                  <span className="font-semibold tabular-nums">{r.score}</span>
                </li>
              ))}
            </ul>
            {person.attendanceSummary && (
              <div className="rounded-lg bg-muted/60 p-3 text-xs" data-testid="attendance">
                <div className="mb-2 font-medium">
                  {t.attendance} · <span className="text-muted-foreground">{fmt(t.lastMonths, { n: person.attendanceSummary.months })}</span>
                </div>
                <dl className="grid grid-cols-3 gap-2">
                  <div>
                    <dt className="text-muted-foreground">{t.attendanceRate}</dt>
                    <dd className="text-sm font-semibold tabular-nums">{formatPercent(person.attendanceSummary.rate, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t.lateArrivals}</dt>
                    <dd className="text-sm font-semibold tabular-nums">{person.attendanceSummary.lateArrivals}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t.absences}</dt>
                    <dd className="text-sm font-semibold tabular-nums">{person.attendanceSummary.unplannedAbsences}</dd>
                  </div>
                </dl>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills & training */}
        <Card>
          <CardHeader>
            <CardTitle>{t.skills}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {p && (
              <ul className="flex flex-col gap-2 text-xs" data-testid="skills">
                {[...p.skills].sort((a, b) => b.level - a.level).map((s) => (
                  <li key={s.code} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                    <span>{L(COMPETENCIES, s.code)}</span>
                    <span className="tabular-nums text-muted-foreground">{s.level}/5</span>
                    <div className="col-span-2">
                      <Meter value={s.level} max={5} tone={s.level >= 4 ? "good" : s.level <= 2 ? "watch" : "primary"} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {person.trainings.length > 0 && (
              <div>
                <h3 className="text-muted-foreground mb-2 text-xs font-medium">{t.training}</h3>
                <ul className="flex flex-col gap-1.5 text-xs" data-testid="trainings">
                  {person.trainings.map((tr) => (
                    <li key={tr.id} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate">{L(TRAINING_COURSES, tr.courseCode)}</span>
                      <Badge variant={tr.status === "completed" ? "good" : tr.status === "in_progress" ? "secondary" : "muted"}>
                        {t.trainingStatus[tr.status]}
                        {tr.completedOn ? ` · ${formatDate(tr.completedOn, locale, "short")}` : ""}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {dna ? (
          <Card data-testid="player-dna">
            <CardHeader>
              <CardTitle>{st.dnaTitle}</CardTitle>
              <CardDescription>{st.playerDnaNote}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="font-medium">{dna.style ? st.styles[dna.style as keyof typeof st.styles] : fmt(st.dnaForming, { n: 3 })}</p>
              <ul className="flex flex-col gap-2.5">
                {DNA_DIMENSIONS.map((d) => (
                  <li key={d} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-xs">
                    <span>{st.dims[d]}</span>
                    <span className="tabular-nums">{dna.scores[d]}</span>
                    <div className="col-span-2"><Meter value={dna.scores[d]} /></div>
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/leadership`} className="text-primary text-xs hover:underline">{st.viewDna}</Link>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="memories">
            <CardHeader>
              <CardTitle>{st.memoriesTitle}</CardTitle>
              <CardDescription className="flex flex-wrap gap-x-4 gap-y-1">
                <span>{st.trustNow}: <TrustValue value={trustOf(run.world, run.state, id)} /></span>
                <span>{st.trustStart}: <span className="tabular-nums" dir="ltr">{run.world.baseTrust.get(id) ?? 50}</span></span>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              {memories.length === 0 ? (
                <p className="text-muted-foreground">{st.memoriesEmpty}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {memories.map((m, i) => (
                    <li key={i} className="flex flex-col gap-0.5 rounded-lg border p-2.5" data-testid="memory">
                      <span className="text-muted-foreground flex items-center gap-2 text-[11px]">
                        <Badge variant={m.type === "grievance" ? "critical" : m.type === "recognition" ? "good" : "muted"}>{st.memoryType[m.type]}</Badge>
                        {dict.common.day} {m.day}
                      </span>
                      <span>{m.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
        {p && (
          <Card>
            <CardHeader>
              <CardTitle>{t.personality}</CardTitle>
              <CardDescription className="flex items-start gap-1.5">
                <Bot className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {t.aiNote}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm" data-testid="personality">
              <ul className="flex flex-col gap-2.5">
                {(Object.keys(t.traits) as Array<keyof typeof t.traits>).map((k) => (
                  <li key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-xs">
                    <span>{t.traits[k]}</span>
                    <span className="tabular-nums">{p.personality[k]}</span>
                    <div className="col-span-2"><Meter value={p.personality[k]} /></div>
                  </li>
                ))}
              </ul>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">{t.motivators}</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">{p.behavior.motivators.map((m) => <Badge key={m} variant="secondary">{L(MOTIVATORS, m)}</Badge>)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t.stressTriggers}</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">{p.behavior.stressTriggers.map((m) => <Badge key={m} variant="outline">{L(STRESS_TRIGGERS, m)}</Badge>)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t.conflict}</dt>
                  <dd className="mt-1 font-medium">{L(CONFLICT_APPROACHES, p.behavior.conflictApproach)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t.decision}</dt>
                  <dd className="mt-1 font-medium">{L(DECISION_STYLES, p.behavior.decisionStyle)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t.relationships} ({person.relationships.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3" data-testid="relationships">
              {person.relationships.map(({ relationship: r, counterpart, direction }) => (
                <li key={r.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <PersonLink id={counterpart.id} name={counterpart.fullName} subtitle={counterpart.jobTitle[locale]} locale={locale} highlight={counterpart.isPlayer} />
                    <Badge variant={r.type === "friction" || r.type === "rivalry" ? "critical" : r.type === "friendship" || r.type === "mentorship" ? "good" : "secondary"}>
                      {t.relType[r.type]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{r.description[locale]}</p>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                    {(
                      [
                        [t.trust, r.trust],
                        [t.rapport, r.rapport],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k}>
                        <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="tabular-nums">{formatNumber(v, locale)}</span></div>
                        <Meter value={(v + 100) / 2} tone={v >= 50 ? "good" : v < 20 ? "critical" : "watch"} />
                      </div>
                    ))}
                  </div>
                  <div className="text-muted-foreground mt-1.5 text-[11px]">
                    {direction === "outgoing" ? (e.isPlayer ? t.yourView : t.theirView) : `${counterpart.fullName[locale]} → ${e.fullName[locale]}`}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
