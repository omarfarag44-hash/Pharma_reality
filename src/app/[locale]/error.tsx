"use client";

import { useParams } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale: string }>();
  const dict = getDictionary(params?.locale && isLocale(params.locale) ? params.locale : "ar");
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center" role="alert">
      <h1 className="text-xl font-semibold">{dict.errors.title}</h1>
      <p className="text-muted-foreground max-w-md text-sm">{dict.errors.dataSource}</p>
      <p className="text-muted-foreground max-w-md font-mono text-xs" dir="ltr">{error.message}</p>
      <Button onClick={reset}>{dict.errors.retry}</Button>
    </div>
  );
}
