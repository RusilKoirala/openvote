import { CheckCircle2, Clock, Circle } from "lucide-react";
import type { NationalStats } from "@/lib/types";

interface NationalOverviewProps {
  stats: NationalStats;
}

export function NationalOverview({ stats }: NationalOverviewProps) {
  const declared = stats.resultsDeclared;
  const counting = stats.counting;
  const notStarted = stats.notStarted;
  const total = stats.totalConstituencies; // 165

  const declaredPct = (declared / total) * 100;
  const countingPct = (counting / total) * 100;
  const reportingPct = Math.min(100, Math.round(((declared + counting) / total) * 100));

  const tiles = [
    {
      label: "Results Declared",
      value: declared,
      icon: CheckCircle2,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      valueClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900",
    },
    {
      label: "Counting",
      value: counting,
      icon: Clock,
      iconClass: "text-amber-600 dark:text-amber-400",
      valueClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900",
    },
    {
      label: "Not Started",
      value: notStarted,
      icon: Circle,
      iconClass: "text-slate-500 dark:text-slate-400",
      valueClass: "text-slate-600 dark:text-slate-300",
      bgClass: "bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Big reporting banner */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight text-foreground">
          {reportingPct}%
        </span>
        <span className="text-base sm:text-lg font-semibold text-muted-foreground">
          of constituencies reporting
        </span>
        <span className="text-sm text-muted-foreground ml-auto hidden sm:block">
          {declared + counting} of {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden flex" role="progressbar" aria-valuenow={reportingPct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${declaredPct}%` }}
        />
        <div
          className="h-full bg-amber-400 transition-all duration-700"
          style={{ width: `${countingPct}%` }}
        />
      </div>

      {/* Tile row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className={`rounded-xl border p-3 sm:p-4 flex flex-col gap-0.5 ${tile.bgClass}`}>
            <tile.icon className={`w-4 h-4 mb-1 ${tile.iconClass}`} aria-hidden />
            <p className={`text-2xl sm:text-3xl font-black tabular-nums leading-none ${tile.valueClass}`}>
              {tile.value}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight mt-0.5">{tile.label}</p>
          </div>
        ))}
      </div>

      {/* Legend + votes */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shrink-0" />
          Declared
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block shrink-0" />
          Counting
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/25 inline-block shrink-0" />
          Not started
        </span>
        {stats.totalVotesCounted > 0 && (
          <span className="ml-auto">
            <span className="font-semibold text-foreground">
              {stats.totalVotesCounted.toLocaleString()}
            </span>{" "}
            total votes
          </span>
        )}
      </div>
    </div>
  );
}

