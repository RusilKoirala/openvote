"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ConstituencyResult } from "@/lib/types";

interface TickerItem {
  label: string;
  value: string;
  color?: string;
}

interface LiveTickerProps {
  constituencies: ConstituencyResult[];
}

function buildTickerItems(constituencies: ConstituencyResult[]): TickerItem[] {
  const items: TickerItem[] = [];

  for (const c of constituencies) {
    if (c.countingStatus === "complete" && c.winner) {
      items.push({
        label: c.name,
        value: `${c.winner.name} (${c.winner.party.split(" ").slice(0, 2).join(" ")}) wins`,
        color: c.winner.partyColor,
      });
    } else if (c.countingStatus === "counting" && c.candidates.length > 0) {
      const leader = [...c.candidates].sort((a, b) => b.votes - a.votes)[0];
      const margin = c.candidates.length > 1
        ? leader.votes - [...c.candidates].sort((a, b) => b.votes - a.votes)[1].votes
        : 0;
      items.push({
        label: c.name,
        value: `${leader.name} leads by ${margin.toLocaleString()} votes`,
        color: leader.partyColor,
      });
    }
  }

  return items;
}

export function LiveTicker({ constituencies }: LiveTickerProps) {
  const [idx, setIdx] = useState(0);
  const items = buildTickerItems(constituencies);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const item = items[idx];

  return (
    <div className="bg-red-600 text-white text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
        {/* LIVE tag */}
        <span className="font-bold tracking-widest text-[10px] bg-white text-red-600 px-2 py-0.5 rounded flex-shrink-0">
          LIVE
        </span>

        {/* Ticker content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold flex-shrink-0">{item.label}:</span>
            <span className="truncate opacity-90">{item.value}</span>
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setIdx((i) => (i === 0 ? items.length - 1 : i - 1))}
            className="p-0.5 rounded hover:bg-red-700 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs opacity-70">{idx + 1}/{items.length}</span>
          <button
            onClick={() => setIdx((i) => (i + 1) % items.length)}
            className="p-0.5 rounded hover:bg-red-700 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
