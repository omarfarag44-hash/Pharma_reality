import type { Dictionary } from "@/lib/i18n";

export function BrandMark({ dict }: { dict: Dictionary }) {
  return (
    <div className="flex items-center gap-3">
      <div aria-hidden className="grid size-9 place-items-center rounded-lg bg-[#008f8a] text-white">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M12 4v16M4 12h16" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold tracking-wide text-white" dir="ltr">
          {dict.meta.product}
        </div>
        <div className="text-sidebar-muted truncate text-xs">{dict.meta.tagline}</div>
      </div>
    </div>
  );
}
