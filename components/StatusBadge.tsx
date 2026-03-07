import { cn } from "@/lib/utils";
import type { CountingStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  CountingStatus,
  { label: string; dotClass: string; textClass: string; bgClass: string }
> = {
  "not-started": {
    label: "Not Started",
    dotClass: "bg-muted-foreground",
    textClass: "text-muted-foreground",
    bgClass: "bg-muted",
  },
  counting: {
    label: "Counting",
    dotClass: "bg-amber-500 animate-pulse",
    textClass: "text-amber-700 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/40",
  },
  complete: {
    label: "Complete",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
  },
};

interface StatusBadgeProps {
  status: CountingStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  );
}
