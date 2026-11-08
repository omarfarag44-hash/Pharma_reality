import Link from "next/link";
import { pageContext } from "@/lib/page";
import { fmt } from "@/lib/i18n";
import { getDepartments } from "@/services/org-service";
import { PageHeader } from "@/components/shared/page-header";
import { PersonLink } from "@/components/shared/person-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DepartmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, repo } = await pageContext(params);
  const departments = await getDepartments(repo);
  const t = dict.departments;
  return (
    <>
      <PageHeader title={t.title} description={t.subtitle} />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="department-grid">
        {departments.map((d) => (
          <li key={d.department.code} data-testid="department-card">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>
                    <Link href={`/${locale}/departments/${d.department.code}`} className="hover:underline">{d.department.name[locale]}</Link>
                  </CardTitle>
                  <Badge variant={d.kpisOnTrack === d.department.kpis.length ? "good" : d.kpisOnTrack === 0 ? "critical" : "watch"} className="tabular-nums">
                    {d.kpisOnTrack}/{d.department.kpis.length}
                  </Badge>
                </div>
                <CardDescription>{d.department.description[locale]}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-3">
                <PersonLink id={d.head.id} name={d.head.fullName} subtitle={d.head.jobTitle[locale]} locale={locale} highlight />
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>{d.members.length + 1} {dict.common.people}</span>
                  <span>{fmt(dict.dashboard.kpisOnTrack, { n: d.kpisOnTrack, total: d.department.kpis.length })}</span>
                </div>
                <Link href={`/${locale}/departments/${d.department.code}`} className="text-primary text-xs font-medium hover:underline">{dict.common.viewProfile}</Link>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
