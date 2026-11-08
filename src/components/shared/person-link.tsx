import Link from "next/link";
import type { Locale, LocalizedText } from "@/domain/common";
import { cn } from "@/lib/utils";

export function initials(name: string): string {
  const parts = name.replace(/^(Dr\.|د\.)\s*/, "").replace(/\(.*\)/, "").trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p.replace(/^(Al-|ال)/, "").charAt(0)).join("").toUpperCase();
}

export function Avatar({ name, className, highlight }: { name: string; className?: string; highlight?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
        highlight ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function PersonLink({
  id,
  name,
  subtitle,
  locale,
  highlight,
  className,
}: {
  id: string;
  name: LocalizedText;
  subtitle?: string;
  locale: Locale;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <Link href={`/${locale}/people/${id}`} className={cn("group flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>
      <Avatar name={name[locale]} highlight={highlight} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium group-hover:underline">{name[locale]}</span>
        {subtitle && <span className="text-muted-foreground block truncate text-xs">{subtitle}</span>}
      </span>
    </Link>
  );
}
