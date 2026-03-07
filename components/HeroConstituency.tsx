import Link from "next/link";
import { MapPin, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { VoteBar } from "@/components/VoteBar";
import type { ConstituencyResult } from "@/lib/types";

interface HeroConstituencyProps {
  constituency: ConstituencyResult;
}

export function HeroConstituency({ constituency: c }: HeroConstituencyProps) {
  const sorted = [...c.candidates].sort((a, b) => b.votes - a.votes);
  const leader = sorted[0];
  const runner = sorted[1];
  const isComplete = c.countingStatus === "complete";
  const winner = isComplete ? c.winner ?? leader : null;
  const margin = leader && runner ? leader.votes - runner.votes : 0;

  return (
    <Link href={`/constituency/${c.slug}`} className="group block">
      <Card className="relative overflow-hidden border-2 border-primary/20 bg-linear-to-br from-background to-muted/30 hover:border-primary/50 hover:shadow-xl transition-all duration-300">
        {/* Background accent */}
        {leader && (
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at top right, ${leader.partyColor}, transparent 60%)`,
            }}
          />
        )}

        <CardContent className="p-5 sm:p-7 space-y-5 relative">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {c.district} · {c.province}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{c.name}</h2>
              {c.nameNepali && (
                <p className="text-base text-muted-foreground mt-0.5">{c.nameNepali}</p>
              )}
            </div>

            {/* Status */}
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={c.countingStatus} />
            </div>
          </div>

          {/* Vote bar */}
          <div className="space-y-2">
            <VoteBar candidates={c.candidates} showLabels={false} />
          </div>

          {/* Candidates */}
          <div className="space-y-2.5">
            {sorted.slice(0, 4).map((candidate, i) => {
              const isLeading = i === 0;
              return (
                <div
                  key={candidate.id}
                  className="flex items-center gap-3"
                >
                  {/* Color dot + rank */}
                  <div className="flex items-center gap-2 w-5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: candidate.partyColor }}
                    />
                  </div>

                  {/* Name + party */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${isLeading ? "text-foreground" : "text-muted-foreground"}`}>
                        {candidate.name}
                      </span>
                      {winner && winner.id === candidate.id && (
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{candidate.party}</p>
                  </div>

                  {/* Vote bar */}
                  <div className="hidden sm:block w-28">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${candidate.percentage}%`,
                          backgroundColor: candidate.partyColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Votes + pct */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isLeading ? "text-foreground" : "text-muted-foreground"}`}>
                      {candidate.votes.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{candidate.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer stats */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {c.totalVotes.toLocaleString()} votes counted
            </span>
            {c.totalVoters && (
              <span>
                of {c.totalVoters.toLocaleString()} registered
                ({Math.round((c.totalVotes / c.totalVoters) * 100)}% turnout)
              </span>
            )}
            {margin > 0 && leader && (
              <span className="ml-auto font-medium" style={{ color: leader.partyColor }}>
                Lead: {margin.toLocaleString()}
              </span>
            )}
            {c.countingStatus === "counting" && (
              <span className="ml-auto">
                {c.countedPercentage}% counted
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
