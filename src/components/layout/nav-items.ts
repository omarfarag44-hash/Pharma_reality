import type { Dictionary } from "@/lib/i18n";

export const NAV_ITEMS = [
  { href: "", key: "dashboard", icon: "dashboard" },
  { href: "/today", key: "today", icon: "today" },
  { href: "/leadership", key: "leadership", icon: "leadership" },
  { href: "/coaching", key: "coaching", icon: "coaching" },
  { href: "/organization", key: "organization", icon: "org" },
  { href: "/branches", key: "branches", icon: "branches" },
  { href: "/employees", key: "employees", icon: "employees" },
  { href: "/departments", key: "departments", icon: "departments" },
  { href: "/peers", key: "peers", icon: "peers" },
  { href: "/calendar", key: "calendar", icon: "calendar" },
  { href: "/knowledge", key: "knowledge", icon: "knowledge" },
] as const satisfies ReadonlyArray<{ href: string; key: keyof Dictionary["nav"]; icon: string }>;
