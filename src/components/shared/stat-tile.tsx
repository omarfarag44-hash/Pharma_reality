import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({ label, value, detail, icon, className, testId }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode; className?: string; testId?: string }) {
  return (
    <Card className={cn("gap-2 py-4", className)} data-testid={testId}>
      <div className="flex items-center justify-between gap-2 px-5">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        {icon && <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>}
      </div>
      <div className="px-5 text-2xl font-semibold tracking-tight tabular-nums" data-testid={testId ? `${testId}-value` : undefined}>
        {value}
      </div>
      {detail && <div className="text-muted-foreground px-5 text-xs">{detail}</div>}
    </Card>
  );
}
