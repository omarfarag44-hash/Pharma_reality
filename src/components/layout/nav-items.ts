import type { Dictionary } from "@/lib/i18n";

export const NAV_ITEMS = [
  { href: "", key: "dashboard", icon: "dashboard" },
  { href: "/organization", key: "organization", icon: "org" },
  { href: "/branches", key: "branches", icon: "branches" },
  { href: "/employees", key: "employees", icon: "employees" },
  { href: "/departments", key: "departments", icon: "departments" },
  { href: "/peers", key: "peers", icon: "peers" },
  { href: "/calendar", key: "calendar", icon: "calendar" },
] as const satisfies ReadonlyArray<{ href: string; key: keyof Dictionary["nav"]; icon: string }>;
