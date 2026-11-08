import Link from "next/link";
import { headers } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const h = await headers();
  const locale = h.get("x-pr-locale") === "en" ? "en" : "ar";
  const dict = getDictionary(locale);
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center" data-testid="not-found">
      <div className="text-muted-foreground text-5xl font-semibold">404</div>
      <h1 className="text-xl font-semibold">{dict.errors.notFound}</h1>
      <Button asChild><Link href={`/${locale}`}>{dict.errors.home}</Link></Button>
    </div>
  );
}
