import Link from "next/link";
import { CalendarDays, Flag } from "lucide-react";
import { fmt } from "@/lib/i18n";
import { formatDate, formatWeekday } from "@/lib/i18n/format";
import { pageContext } from "@/lib/page";
import { buildCalendar, type CalendarDay } from "@/lib/simulation/calendar";
import { CalendarViewSchema } from "@/validation/filters";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function DayCell({ day, locale, weekendLabel }: { day: CalendarDay; locale: "ar" | "en"; weekendLabel: string }) {
  return (
    <div
      data-testid="calendar-day"
      data-day={day.dayNumber}
      data-current={day.status === "current" ? "true" : undefined}
      aria-current={day.status === "current" ? "date" : undefined}
      title={day.isWeekend ? weekendLabel : undefined}
      className={cn(
        "flex min-h-14 flex-col justify-between rounded-md border p-1.5 text-[11px]",
        day.isWeekend && "bg-muted/60",
        day.status === "current" && "border-primary bg-primary text-primary-foreground ring-primary/20 ring-2",
      )}
    >
      <span className="font-semibold tabular-nums">{day.dayNumber}</span>
      <span className={cn("truncate", day.status === "current" ? "opacity-90" : "text-muted-foreground")}>{formatDate(day.date, locale, "short")}</span>
    </div>
  );
}

export default async function CalendarPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, dict, repo } = await pageContext(params);
  const view = CalendarViewSchema.parse((await searchParams).view);
  const session = await repo.getSimulationSession();
  const cal = buildCalendar(session);
  const t = dict.calendar;
  const weekdayHeaders = cal.days.slice(0, 7);

  return (
    <>
      <PageHeader title={t.title} description={t.subtitle} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile testId="calendar-current-day" label={t.currentDay} value={`${dict.common.day} ${session.currentDay}`} detail={`${dict.common.of} ${session.lengthDays}`} icon={<Flag />} />
        <StatTile testId="calendar-current-date" label={t.currentDate} value={<span className="text-lg">{formatDate(cal.currentDate, locale, "long")}</span>} icon={<CalendarDays />} />
        <StatTile label={t.period} value={<span className="text-lg">{formatDate(session.startDate, locale)} – {formatDate(cal.endDate, locale)}</span>} />
        <StatTile label={t.progress} value={`${cal.progressPct.toFixed(1)}%`} detail={<Progress value={Math.max(cal.progressPct, 1.1)} />} />
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label={t.title} className="bg-muted inline-flex rounded-lg p-[3px]" data-testid="calendar-view">
          {(["day", "week", "month"] as const).map((v) => (
            <Link
              key={v}
              href={`/${locale}/calendar?view=${v}`}
              aria-current={view === v ? "page" : undefined}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium", view === v ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {t.view[v]}
            </Link>
          ))}
        </nav>
        <p className="text-muted-foreground text-xs">{t.noEvents}</p>
      </div>

      {view === "day" && (
        <Card className="mt-4">
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5 text-center" data-testid="calendar-grid">
              {weekdayHeaders.map((d) => (
                <div key={d.weekday} className="text-muted-foreground pb-1 text-[11px] font-medium">{formatWeekday(d.date, locale)}</div>
              ))}
              {cal.days.map((d) => <DayCell key={d.dayNumber} day={d} locale={locale} weekendLabel={t.weekend} />)}
            </div>
          </CardContent>
        </Card>
      )}

      {view === "week" && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="calendar-weeks">
          {cal.weeks.map((w) => (
            <li key={w.weekNumber}>
              <Card className={cn("h-full gap-3 py-4", w.status === "current" && "border-primary")}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-sm">{fmt(t.simWeek, { n: w.weekNumber })}</CardTitle>
                  <Badge variant={w.status === "current" ? "default" : "muted"}>{t.status[w.status]}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="text-muted-foreground text-xs">
                    {fmt(t.days, { a: w.startDay, b: w.endDay })} · {formatDate(w.startDate, locale, "short")} – {formatDate(w.endDate, locale, "short")}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {w.days.map((d) => (
                      <span
                        key={d.dayNumber}
                        title={`${dict.common.day} ${d.dayNumber} · ${formatDate(d.date, locale)}`}
                        data-current={d.status === "current" ? "true" : undefined}
                        className={cn("grid h-7 place-items-center rounded text-[11px] tabular-nums", d.status === "current" ? "bg-primary text-primary-foreground font-semibold" : d.isWeekend ? "bg-muted text-muted-foreground" : "border")}
                      >
                        {d.dayNumber}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {view === "month" && (
        <ul className="mt-4 grid gap-4 lg:grid-cols-3" data-testid="calendar-months">
          {cal.months.map((m) => (
            <li key={m.monthNumber}>
              <Card className={cn("h-full", m.status === "current" && "border-primary")}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>{fmt(t.simMonth, { n: m.monthNumber })}</CardTitle>
                  <Badge variant={m.status === "current" ? "default" : "muted"}>{t.status[m.status]}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <div className="text-muted-foreground text-xs">
                    {fmt(t.days, { a: m.startDay, b: m.endDay })} · {formatDate(m.startDate, locale)} – {formatDate(m.endDate, locale)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {m.weeks.map((w) => (
                      <Badge key={w} variant="outline">{fmt(t.simWeek, { n: w })}</Badge>
                    ))}
                  </div>
                  <Progress value={m.status === "past" ? 100 : m.status === "current" ? ((session.currentDay - m.startDay) / (m.endDay - m.startDay + 1)) * 100 : 0} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
