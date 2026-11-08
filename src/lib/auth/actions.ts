"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { resolveEnv } from "@/lib/env";
import { isLocale } from "@/lib/i18n";

const SignInSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(200),
  locale: z.string(),
});

export async function signIn(formData: FormData): Promise<void> {
  const parsed = SignInSchema.safeParse(Object.fromEntries(formData));
  const locale = parsed.success && isLocale(parsed.data.locale) ? parsed.data.locale : "ar";
  if (!parsed.success || resolveEnv().mode !== "supabase") redirect(`/${locale}/login?error=1`);
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) redirect(`/${locale}/login?error=1`);
  redirect(`/${locale}`);
}

export async function signOut(formData: FormData): Promise<void> {
  const raw = String(formData.get("locale") ?? "ar");
  const locale = isLocale(raw) ? raw : "ar";
  if (resolveEnv().mode === "supabase") {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect(`/${locale}/login`);
}
