import { cn } from "@/lib/utils";
import type { CandidateResult } from "@/lib/types";

interface VoteBarProps {
  candidates: CandidateResult[];
  showLabels?: boolean;
  compact?: boolean;
}

export function VoteBar({ candidates, showLabels = true, compact = false }: VoteBarProps) {
  const sorted = [...candidates].sort((a, b) => b.votes - a.votes);
  const total = sorted.reduce((s, c) => s + c.votes, 0);

  if (total === 0) {
    return (
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div className="h-full w-full bg-muted-foreground/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Multi-color stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {sorted.map((c) => (
          <div
            key={c.id}
            title={`${c.name} (${c.party}): ${c.votes.toLocaleString()} votes`}
            style={{
              width: `${(c.votes / total) * 100}%`,
              backgroundColor: c.partyColor,
            }}
            className="transition-all duration-500 min-w-[2px]"
          />
        ))}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className={cn("flex flex-wrap gap-x-3 gap-y-1", compact ? "text-[10px]" : "text-xs")}>
          {sorted.slice(0, compact ? 3 : undefined).map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1 text-muted-foreground">
              <span
                className="inline-block w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: c.partyColor }}
              />
              <span className="font-medium">{c.percentage.toFixed(1)}%</span>
              <span className="hidden sm:inline truncate max-w-[80px]">{c.name.split(" ")[0]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
