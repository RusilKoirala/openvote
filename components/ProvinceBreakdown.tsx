export type ProvinceStat = {
  name: string;
  total: number;
  declared: number;
  counting: number;
  topParties: Array<{ slug: string; name: string; color: string; won: number; leading: number }>;
};

const PARTY_ABBREV: Record<string, string> = {
  nc: "NC",
  uml: "UML",
  mc: "MC",
  "rastriya-swatantra": "RSP",
  rpp: "RPP",
  janamat: "JAN",
  nagarik: "NUP",
  ujyalo: "UJY",
  others: "IND",
};

function abbrev(slug: string, name: string): string {
  return (
    PARTY_ABBREV[slug] ??
    name
      .replace(/[()[\]]/g, "")
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 4)
  );
}

export function ProvinceBreakdown({ provinces }: { provinces: ProvinceStat[] }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
      <div className="grid grid-cols-7 gap-2 w-175 sm:w-auto sm:grid-cols-4 lg:grid-cols-7">
        {provinces.map((p) => {
          const declaredPct = (p.declared / p.total) * 100;
          const countingPct = (p.counting / p.total) * 100;
          return (
            <div key={p.name} className="rounded-xl border bg-card p-3 space-y-2.5">
              <div>
                <p className="text-xs font-semibold leading-tight truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {p.declared}/{p.total} declared
                </p>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${declaredPct}%` }}
                />
                <div
                  className="h-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${countingPct}%` }}
                />
              </div>

              {/* Top parties */}
              <div className="space-y-1.5">
                {p.topParties.length > 0 ? (
                  p.topParties.slice(0, 3).map((party) => (
                    <div key={party.slug} className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-sm shrink-0"
                        style={{ backgroundColor: party.color }}
                      />
                      <span className="text-[10px] font-medium truncate flex-1 text-muted-foreground">
                        {abbrev(party.slug, party.name)}
                      </span>
                      <span className="text-[10px] font-bold tabular-nums">
                        {party.won + party.leading}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">No results yet</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
