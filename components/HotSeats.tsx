import Link from "next/link";
import { Flame } from "lucide-react";
import type { ConstituencyResult } from "@/lib/types";

interface HotSeat {
  constituency: ConstituencyResult;
  leader: { name: string; party: string; partyColor: string; votes: number };
  runnerUp: { name: string; party: string; partyColor: string; votes: number };
  margin: number;
  marginPct: number;
}

export function HotSeats({ constituencies }: { constituencies: ConstituencyResult[] }) {
  const hot: HotSeat[] = [];

  for (const c of constituencies) {
    if (c.countingStatus !== "counting") continue;
    const [first, second] = c.candidates;
    if (!first || !second || first.votes === 0) continue;
    const margin = first.votes - second.votes;
    const marginPct = first.votes > 0 ? (margin / first.votes) * 100 : 100;
    if (marginPct < 15) {
      hot.push({
        constituency: c,
        leader: { name: first.name, party: first.party, partyColor: first.partyColor, votes: first.votes },
        runnerUp: { name: second.name, party: second.party, partyColor: second.partyColor, votes: second.votes },
        margin,
        marginPct,
      });
    }
  }

  if (hot.length === 0) return null;

  hot.sort((a, b) => a.marginPct - b.marginPct);

  return (
    <section aria-label="Hot seats">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-orange-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Hot Seats
        </h2>
        <span className="text-xs text-muted-foreground">(Margin &lt;15%)</span>
        <span className="ml-auto text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 px-2 py-0.5 rounded-full">
          {hot.length} tight races
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {hot.slice(0, 9).map(({ constituency, leader, runnerUp, margin, marginPct }) => {
          const leaderPct = (leader.votes / (leader.votes + runnerUp.votes)) * 100;
          const urgency = marginPct < 5 ? "high" : marginPct < 10 ? "mid" : "low";
          const urgencyRing = urgency === "high" ? "hover:border-red-400" : urgency === "mid" ? "hover:border-amber-400" : "hover:border-orange-400";
          return (
          <Link
            key={constituency.id}
            href={`/constituency/${constituency.slug}`}
            className={`group block rounded-xl border bg-card ${urgencyRing} hover:shadow-md transition-all p-4 space-y-3`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{constituency.name}</p>
                <p className="text-xs text-muted-foreground">{constituency.district} · {constituency.province}</p>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums"
                style={{
                  backgroundColor: urgency === "high" ? "#FEE2E2" : urgency === "mid" ? "#FEF3C7" : "#FFF7ED",
                  color: urgency === "high" ? "#DC2626" : urgency === "mid" ? "#D97706" : "#EA580C",
                }}
              >
                {marginPct.toFixed(1)}%
              </span>
            </div>

            {/* Two-tone battle bar */}
            <div className="h-3 rounded-full overflow-hidden flex">
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${leaderPct}%`, backgroundColor: leader.partyColor }}
              />
              <div
                className="h-full flex-1 transition-all duration-700"
                style={{ backgroundColor: runnerUp.partyColor, opacity: 0.7 }}
              />
            </div>

            {/* VS battle */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
              {/* Leader */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: leader.partyColor }} />
                <div className="min-w-0">
                  <p className="font-semibold truncate leading-tight">{leader.name.split(" ")[0]}</p>
                  <p className="text-muted-foreground tabular-nums">{leader.votes.toLocaleString()}</p>
                </div>
              </div>
              {/* VS */}
              <span className="text-[10px] font-bold text-muted-foreground/60 shrink-0">VS</span>
              {/* Runner-up */}
              <div className="flex items-center gap-1.5 min-w-0 justify-end text-right">
                <div className="min-w-0">
                  <p className="font-medium text-muted-foreground truncate leading-tight">{runnerUp.name.split(" ")[0]}</p>
                  <p className="text-muted-foreground tabular-nums">{runnerUp.votes.toLocaleString()}</p>
                </div>
                <span className="w-2 h-2 rounded-full shrink-0 opacity-70" style={{ backgroundColor: runnerUp.partyColor }} />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground border-t pt-2.5">
              Gap: <span className="font-semibold text-foreground">{margin.toLocaleString()} votes</span>
            </p>
          </Link>
        );
        })}
      </div>
    </section>
  );
}
