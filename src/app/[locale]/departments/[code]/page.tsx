import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { COMMUNICATION_STYLE_SHORT } from "@/domain/catalogs";
import { pageContext } from "@/lib/page";
import { getDepartmentDetail } from "@/services/org-service";
import { KpiList } from "@/components/departments/kpi-list";
import { PageHeader } from "@/components/shared/page-header";
import { PersonLink } from "@/components/shared/person-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DepartmentPage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { code } = await params;
  const { locale, dict, repo } = await pageContext(params);
  const d = await getDepartmentDetail(repo, code);
  if (!d) notFound();
  const t = dict.departments;
  const style = (c?: string) => (c ? COMMUNICATION_STYLE_SHORT[c as keyof typeof COMMUNICATION_STYLE_SHORT]?.[locale] : undefined);
  return (
    <>
      <Link href={`/${locale}/departments`} className="text-muted-foreground mb-3 inline-flex items-center gap-1.5 text-xs hover:underline">
        <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
        {dict.nav.departments}
      </Link>
      <PageHeader eyebrow={<span className="ltr-nums">{d.department.code}</span>} title={d.department.name[locale]} description={d.department.description[locale]} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>{t.head}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <PersonLink id={d.head.id} name={d.head.fullName} subtitle={d.head.jobTitle[locale]} locale={locale} highlight />
            {d.headProfile && <p className="text-muted-foreground text-xs leading-relaxed">{d.headProfile.summary[locale]}</p>}
            {d.reportsTo && (
              <div>
                <div className="text-muted-foreground mb-2 text-xs">{t.reporting}</div>
                <PersonLink id={d.reportsTo.id} name={d.reportsTo.fullName} subtitle={d.reportsTo.jobTitle[locale]} locale={locale} />
              </div>
            )}
            <div>
              <div className="text-muted-foreground mb-2 text-xs">{t.contact}</div>
              <ul className="flex flex-col gap-1.5 text-xs">
                <li className="flex items-center gap-2"><Mail className="size-3.5" aria-hidden /><span className="ltr-nums">{d.department.contact.email}</span></li>
                <li className="flex items-center gap-2"><Phone className="size-3.5" aria-hidden />{dict.common.extension} <span className="ltr-nums">{d.department.contact.phoneExtension}</span></li>
                <li className="flex items-center gap-2"><MapPin className="size-3.5" aria-hidden />{d.department.contact.location[locale]}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t.responsibilities}</CardTitle></CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-2 ps-5 text-sm" data-testid="responsibilities">
              {d.department.responsibilities.map((r) => <li key={r.en}>{r[locale]}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.kpis}</CardTitle>
            <CardDescription>{t.kpiNote}</CardDescription>
          </CardHeader>
          <CardContent><KpiList kpis={d.department.kpis} locale={locale} dict={dict} /></CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>{t.team} ({d.members.length})</CardTitle></CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="department-members">
            {d.members.map(({ employee: m, profile }) => (
              <li key={m.id} className="rounded-lg border p-3">
                <PersonLink id={m.id} name={m.fullName} subtitle={m.jobTitle[locale]} locale={locale} />
                <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                  <span>{m.yearsOfExperience} {dict.common.yearsShort}</span>
                  <span>{style(profile?.communicationStyle)}</span>
                  <span className="ltr-nums">{dict.common.extension} {m.phoneExtension}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
