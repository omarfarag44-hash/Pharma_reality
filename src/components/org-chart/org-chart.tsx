"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import type { Locale } from "@/domain/common";
import type { OrgChart as OrgChartData, PersonNode } from "@/services/org-service";
import { GROUP_COLORS } from "@/components/charts/palette";
import { Avatar } from "@/components/shared/person-link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface OrgChartLabels {
  executive: string;
  fieldOperations: string;
  yourArea: string;
  peers: string;
  departments: string;
  expandAll: string;
  collapseAll: string;
  expand: string;
  collapse: string;
  you: string;
  leader: string;
  members: string;
}

function PersonCard({ node, locale, labels, emphasis, compact }: { node: PersonNode; locale: Locale; labels: OrgChartLabels; emphasis?: boolean; compact?: boolean }) {
  return (
    <Link
      href={`/${locale}/people/${node.id}`}
      data-testid="org-person"
      data-person-id={node.id}
      className={cn(
        "bg-card group flex min-w-0 items-center gap-2.5 rounded-lg border px-3 shadow-xs outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "py-2" : "py-2.5",
        emphasis && "border-primary/60 ring-primary/15 ring-2",
      )}
    >
      <Avatar name={node.name[locale]} highlight={emphasis || node.isBranchLeader} className={compact ? "size-7 text-[10px]" : undefined} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={cn("truncate font-medium group-hover:underline", compact ? "text-xs" : "text-sm")}>{node.name[locale]}</span>
          {node.isPlayer && <span className="bg-primary text-primary-foreground rounded px-1.5 text-[10px] font-semibold">{labels.you}</span>}
        </span>
        <span className="text-muted-foreground block truncate text-[11px]">{node.title[locale]}</span>
      </span>
      {node.performanceScore !== null && !node.isPlayer && <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{node.performanceScore}</span>}
    </Link>
  );
}

function Connector() {
  return <div aria-hidden className="bg-border mx-auto h-5 w-px" />;
}

export function OrgChart({ data, locale, labels }: { data: OrgChartData; locale: Locale; labels: OrgChartLabels }) {
  const branchKeys = data.branches.map((b) => b.branch.code);
  const deptKeys = data.departments.map((d) => d.department.code);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const allOpen = [...branchKeys, ...deptKeys].every((k) => open.has(k));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setOpen(allOpen ? new Set() : new Set([...branchKeys, ...deptKeys]))} data-testid="org-toggle-all">
          {allOpen ? <ChevronsDownUp aria-hidden /> : <ChevronsUpDown aria-hidden />}
          {allOpen ? labels.collapseAll : labels.expandAll}
        </Button>
      </div>

      {/* Executive chain */}
      <section aria-labelledby="org-exec">
        <h2 id="org-exec" className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">{labels.executive}</h2>
        <div className="mx-auto flex max-w-sm flex-col">
          <PersonCard node={data.ceo} locale={locale} labels={labels} />
          <Connector />
          <PersonCard node={data.operationsDirector} locale={locale} labels={labels} />
          <Connector />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="lg:order-none">
            <h3 className="text-muted-foreground mb-2 text-xs font-medium">{labels.fieldOperations}</h3>
            <PersonCard node={data.player} locale={locale} labels={labels} emphasis />
          </div>
          <div>
            <h3 className="text-muted-foreground mb-2 text-xs font-medium">{labels.peers}</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {data.peers.map((p) => (
                <div key={p.id} className="flex flex-col gap-1">
                  <PersonCard node={p} locale={locale} labels={labels} compact />
                  <span className="text-muted-foreground px-1 text-[11px]">{p.region[locale]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Branches */}
      <section aria-labelledby="org-branches">
        <h2 id="org-branches" className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">{labels.yourArea}</h2>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.branches.map(({ branch, leader, members }) => {
            const isOpen = open.has(branch.code);
            return (
              <li key={branch.code} className="bg-muted/40 rounded-xl border p-3" data-testid="org-branch">
                <button
                  type="button"
                  onClick={() => toggle(branch.code)}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? labels.collapse : labels.expand}: ${branch.name[locale]}`}
                  className="mb-2 flex w-full cursor-pointer items-center justify-between gap-2 rounded text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: GROUP_COLORS[branch.performanceGroup] }} />
                    <span className="ltr-nums text-muted-foreground text-xs">{branch.code}</span>
                    <span className="truncate text-sm font-medium">{branch.name[locale]}</span>
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    {members.length + (leader ? 1 : 0)}
                    <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} aria-hidden />
                  </span>
                </button>
                {leader && <PersonCard node={leader} locale={locale} labels={labels} compact />}
                {isOpen && (
                  <ul className="border-border mt-2 ms-4 flex flex-col gap-1.5 border-s ps-3" data-testid="org-branch-members">
                    {members.map((m) => (
                      <li key={m.id}>
                        <PersonCard node={m} locale={locale} labels={labels} compact />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Departments */}
      <section aria-labelledby="org-depts">
        <h2 id="org-depts" className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">{labels.departments}</h2>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.departments.map(({ department, head, members }) => {
            const isOpen = open.has(department.code);
            return (
              <li key={department.code} className="bg-muted/40 rounded-xl border p-3" data-testid="org-department">
                <button
                  type="button"
                  onClick={() => toggle(department.code)}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? labels.collapse : labels.expand}: ${department.name[locale]}`}
                  className="mb-2 flex w-full cursor-pointer items-center justify-between gap-2 rounded text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="truncate text-sm font-medium">{department.name[locale]}</span>
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    {members.length + 1}
                    <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} aria-hidden />
                  </span>
                </button>
                <PersonCard node={head} locale={locale} labels={labels} compact />
                {isOpen && (
                  <ul className="border-border mt-2 ms-4 flex flex-col gap-1.5 border-s ps-3">
                    {members.map((m) => (
                      <li key={m.id}>
                        <PersonCard node={m} locale={locale} labels={labels} compact />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
