import Link from "next/link";
import { resolveEnv } from "@/lib/env";
import { signIn } from "@/lib/auth/actions";
import { getDictionary, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ error?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const { error } = await searchParams;
  const env = resolveEnv();
  return (
    <div className="mx-auto max-w-sm py-10">
      <Card>
        <CardHeader>
          <CardTitle>{dict.login.title}</CardTitle>
          <CardDescription>{env.mode === "supabase" ? dict.login.subtitle : dict.common.demoModeHint}</CardDescription>
        </CardHeader>
        <CardContent>
          {env.mode === "supabase" ? (
            <form action={signIn} className="flex flex-col gap-3">
              <input type="hidden" name="locale" value={locale} />
              <label className="flex flex-col gap-1.5 text-sm">
                {dict.login.email}
                <Input name="email" type="email" autoComplete="email" required />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                {dict.login.password}
                <Input name="password" type="password" autoComplete="current-password" required minLength={6} />
              </label>
              {error && <p className="text-critical text-sm" role="alert">{dict.login.error}</p>}
              <Button type="submit">{dict.login.submit}</Button>
            </form>
          ) : (
            <Button asChild><Link href={`/${locale}`}>{dict.errors.home}</Link></Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
