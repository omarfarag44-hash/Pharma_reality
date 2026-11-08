"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import type { Locale } from "@/domain/common";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Switches language while keeping the current page and filters. */
export function LanguageSwitch({ locale, label, ariaLabel }: { locale: Locale; label: string; ariaLabel: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const target: Locale = locale === "ar" ? "en" : "ar";
  const rest = pathname.replace(/^\/(ar|en)(?=\/|$)/, "");
  const query = params.toString();
  const href = `/${target}${rest}${query ? `?${query}` : ""}`;
  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={ariaLabel}
      data-testid="language-switch"
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "font-medium")}
    >
      <Languages aria-hidden />
      {label}
    </Link>
  );
}
