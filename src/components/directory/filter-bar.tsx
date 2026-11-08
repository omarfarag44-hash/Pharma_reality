"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export interface SelectField {
  name: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
}

/**
 * URL-driven filter bar. All state lives in the query string, so filtered views
 * are shareable and server-rendered; this component only edits the URL.
 */
export function FilterBar({
  searchLabel,
  searchPlaceholder,
  searchValue,
  selects,
  resetLabel,
  resultLabel,
}: {
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  selects: SelectField[];
  resetLabel: string;
  resultLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest intended query string. Navigations are async, so consecutive edits
  // must build on what was last requested, not on the URL currently rendered.
  const latest = useRef(params.toString());

  useEffect(() => setQuery(searchValue), [searchValue]);
  useEffect(() => {
    latest.current = params.toString();
  }, [params]);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(latest.current);
    Object.entries(changes).forEach(([k, v]) => {
      if (!v || v === "all") next.delete(k);
      else next.set(k, v);
    });
    const qs = next.toString();
    latest.current = qs;
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const onSearch = (value: string) => {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ q: value.trim() }), 250);
  };

  const hasFilters = params.toString().length > 0;

  return (
    <div className="bg-card mb-4 flex flex-col gap-3 rounded-xl border p-3 shadow-xs" role="search">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">{searchLabel}</span>
          <span className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="ps-8"
              data-testid="filter-search"
              aria-label={searchLabel}
            />
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap md:flex-nowrap">
          {selects.map((s) => (
            <label key={s.name} className="flex min-w-0 flex-col gap-1.5 sm:w-44">
              <span className="text-muted-foreground text-xs font-medium">{s.label}</span>
              <NativeSelect value={s.value} onChange={(e) => update({ [s.name]: e.target.value })} data-testid={`filter-${s.name}`} aria-label={s.label}>
                {s.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground inline-flex items-center gap-1.5" aria-live="polite" data-testid="result-count">
          {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          {resultLabel}
        </span>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              if (timer.current) clearTimeout(timer.current);
              latest.current = "";
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            data-testid="filter-reset"
          >
            <RotateCcw aria-hidden />
            {resetLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
