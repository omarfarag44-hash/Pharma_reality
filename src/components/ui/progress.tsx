"use client";
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

function Progress({ className, value, indicatorClassName, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root data-slot="progress" className={cn("bg-muted relative h-1.5 w-full overflow-hidden rounded-full", className)} value={v} {...props}>
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("bg-primary h-full rounded-full transition-all", indicatorClassName)}
        style={{ width: `${v}%`, marginInlineStart: 0 }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
