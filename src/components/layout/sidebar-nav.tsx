"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Building2, CalendarDays, Flag, GraduationCap, LayoutDashboard, Network, Sparkles, Users, UsersRound, Landmark } from "lucide-react";
import type { Locale } from "@/domain/common";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

const ICONS = {
  dashboard: LayoutDashboard,
  today: Flag,
  leadership: Sparkles,
  coaching: GraduationCap,
  org: Network,
  branches: Building2,
  employees: Users,
  departments: Landmark,
  peers: UsersRound,
  calendar: CalendarDays,
  knowledge: BookOpen,
} as const;

export function SidebarNav({ locale, nav, onNavigate }: { locale: Locale; nav: Dictionary["nav"]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label={nav.menu} className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const href = `/${locale}${item.href}`;
        const active = item.href === "" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.key}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-muted",
              active ? "bg-sidebar-accent text-white font-medium" : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {nav[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}
