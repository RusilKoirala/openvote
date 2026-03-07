"use client";

import type { PartySeats } from "@/lib/types";

const TOTAL_SEATS = 165;
const MAJORITY = 83;

// 5 concentric arcs — inner→outer, seat counts sum to 165
// [radius, seatCount]
const RINGS: [number, number][] = [
  [60,  21],
  [82,  27],
  [104, 33],
  [126, 39],
  [148, 45],
];

const CX = 200; // SVG center x
const CY = 220; // baseline (bottom of semicircle)
const DOT_R = 5;

interface PartySeatsChartProps {
  partySeats: PartySeats[];
}

export function PartySeatsChart({ partySeats }: PartySeatsChartProps) {
  const parties = partySeats
    .filter((p) => p.seats + p.leading > 0)
    .sort((a, b) => b.seats + b.leading - (a.seats + a.leading));

  // Build ordered position list: innermost ring first, left → right
  const positions: Array<{ x: number; y: number }> = [];
  for (const [r, n] of RINGS) {
    for (let j = 0; j < n; j++) {
      // angle goes from π (left) to 0 (right) across the semicircle
      const angle = n > 1 ? Math.PI - (j / (n - 1)) * Math.PI : Math.PI / 2;
      positions.push({
        x: CX + r * Math.cos(angle),
        y: CY - r * Math.sin(angle),
      });
    }
  }

  // Assign each seat a color/opacity — won first, then leading, then grey
  const seatInfo: Array<{ color: string; opacity: number; label: string }> = [];
  for (const p of parties) {
    for (let i = 0; i < p.seats; i++)
      seatInfo.push({ color: p.partyColor, opacity: 1, label: `${p.party} — won` });
    for (let i = 0; i < p.leading; i++)
      seatInfo.push({ color: p.partyColor, opacity: 0.35, label: `${p.party} — leading` });
  }
  while (seatInfo.length < TOTAL_SEATS)
    seatInfo.push({ color: "#94a3b8", opacity: 0.15, label: "Not yet reporting" });

  return (
    <div className="space-y-3">
      <svg
        viewBox="0 0 400 230"
        className="w-full max-w-lg mx-auto"
        aria-label="Parliament hemicycle — 165 FPTP seats"
      >
        {/* Seat dots */}
        {positions.map((pos, i) => (
          <circle
            key={i}
            cx={pos.x}
            cy={pos.y}
            r={DOT_R}
            fill={seatInfo[i].color}
            fillOpacity={seatInfo[i].opacity}
          >
            <title>{seatInfo[i].label}</title>
          </circle>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex gap-x-4 gap-y-1.5 flex-wrap text-xs items-center">
        {parties.map((p, i) => (
          <div key={`leg-${p.partySlug}-${i}`} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: p.partyColor }}
            />
            <span className="text-muted-foreground">{p.partyNepali ?? p.party}</span>
            <span className="font-bold tabular-nums">{p.seats + p.leading}</span>
          </div>
        ))}
        <span className="text-[10px] text-muted-foreground/40 ml-auto hidden sm:inline">
          solid = won · faded = leading
        </span>
      </div>
    </div>
  );
}
