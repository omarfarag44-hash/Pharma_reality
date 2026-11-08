import { pageContext } from "@/lib/page";
import { getOrgChart } from "@/services/org-service";
import { OrgChart } from "@/components/org-chart/org-chart";
import { PageHeader } from "@/components/shared/page-header";

export default async function OrganizationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, repo } = await pageContext(params);
  const chart = await getOrgChart(repo);
  const t = dict.org;
  return (
    <>
      <PageHeader title={t.title} description={t.subtitle} />
      <OrgChart
        data={chart}
        locale={locale}
        labels={{
          executive: t.executive,
          fieldOperations: t.fieldOperations,
          yourArea: t.yourArea,
          peers: t.peers,
          departments: t.departments,
          expandAll: dict.common.expandAll,
          collapseAll: dict.common.collapseAll,
          expand: dict.common.expand,
          collapse: dict.common.collapse,
          you: dict.common.you,
          leader: dict.common.leader,
          members: dict.common.members,
        }}
      />
    </>
  );
}
