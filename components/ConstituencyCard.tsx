import Link from "next/link";
import { Trophy, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { VoteBar } from "@/components/VoteBar";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import type { ConstituencyResult } from "@/lib/types";

interface ConstituencyCardProps {
  constituency: ConstituencyResult;
  className?: string;
}

export function ConstituencyCard({ constituency: c, className }: ConstituencyCardProps) {
  const leader = c.candidates.length > 0
    ? [...c.candidates].sort((a, b) => b.votes - a.votes)[0]
    : null;

  const isComplete = c.countingStatus === "complete";
  const winner = isComplete && c.winner ? c.winner : null;

  return (
    <Link href={`/constituency/${c.slug}`} className="group block focus:outline-none focus:ring-2 focus:ring-ring rounded-xl">
      <Card
        className={cn(
          "hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden",
          "group-focus-visible:ring-2 group-focus-visible:ring-ring",
          className
        )}
      >
        {/* Color accent bar at top based on leading party */}
        {leader && (
          <div
            className="h-0.5 w-full"
            style={{ backgroundColor: (winner ?? leader).partyColor }}
          />
        )}
        <CardHeader className="pb-2 space-y-0 pt-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide truncate">{c.district}</p>
              <h3 className="font-semibold text-base leading-tight">{c.name}</h3>
              {c.nameNepali && (
                <p className="text-xs text-muted-foreground mt-0.5">{c.nameNepali}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <StatusBadge status={c.countingStatus} />
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Vote bar */}
          {c.candidates.length > 0 ? (
            <VoteBar candidates={c.candidates} showLabels compact />
          ) : (
            <div className="h-3 rounded-full bg-muted" />
          )}

          {/* Leading / winner */}
          {(winner || leader) && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: `${(winner ?? leader)!.partyColor}15` }}
            >
              {winner ? (
                <Trophy className="w-4 h-4 shrink-0" style={{ color: (winner).partyColor }} />
              ) : (
                <span
                  className="w-2.5 h-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: leader!.partyColor }}
                />
              )}
              <span className="font-medium truncate" style={{ color: (winner ?? leader)!.partyColor }}>
                {(winner ?? leader)!.name}
              </span>
              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {(winner ?? leader)!.votes.toLocaleString()} votes
              </span>
            </div>
          )}

          {/* Counting progress */}
          {c.countingStatus === "counting" && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Turnout</span>
                <span>
                  {c.totalVoters && c.totalVoters > 0
                    ? `${((c.totalVotes / c.totalVoters) * 100).toFixed(1)}%`
                    : `${c.totalVotes.toLocaleString()} votes`}
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${c.totalVoters && c.totalVoters > 0 ? Math.min((c.totalVotes / c.totalVoters) * 100, 100) : 50}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
