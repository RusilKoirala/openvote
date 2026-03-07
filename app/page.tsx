import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Activity, BarChart2, Globe2, Trophy } from "lucide-react";
import { HeroConstituency } from "@/components/HeroConstituency";
import { NationalOverview } from "@/components/NationalOverview";
import { PartySeatsChart } from "@/components/PartySeatsChart";
import { LiveTicker } from "@/components/LiveTicker";
import { HotSeats } from "@/components/HotSeats";
import { ConstituencyList } from "@/components/ConstituencyList";
import { getElectionData, getFeaturedConstituency } from "@/lib/data";
import { ProvinceBreakdown, type ProvinceStat } from "@/components/ProvinceBreakdown";
import { SiteNav } from "@/components/SiteNav";
import { LiveBadge } from "@/components/LiveBadge";
import { RefreshButton } from "@/components/RefreshButton";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Nepal 2082 Election Results — Live",
  description:
    "Live vote counts, party standings, and constituency results for Nepal's 2082 BS general elections. Track all 165 FPTP seats in real time.",
  keywords: [
    "Nepal election 2082",
    "Nepal election results 2082",
    "Nepal vote count live",
    "नेपाल निर्वाचन २०८२",
    "Nepal constituency results",
    "RSP seats 2082",
    "Nepali Congress seats",
  ],
  alternates: { canonical: "https://election.rusil.me" },
  openGraph: {
    title: "Nepal 2082 Election Results — Live",
    description: "Live vote counts and party standings for Nepal's 2082 general elections.",
    type: "website",
    url: "https://election.rusil.me",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nepal 2082 Election Results — Live",
    description: "Live vote counts and party standings for Nepal's 2082 general elections.",
  },
};

export default async function HomePage() {
  const [data, featured] = await Promise.all([
    getElectionData(),
    getFeaturedConstituency(),
  ]);

  const { constituencies, national } = data;
  const counting = constituencies.filter((c) => c.countingStatus === "counting");
  const complete = constituencies.filter((c) => c.countingStatus === "complete");

  // Province-level aggregation
  const PROVINCE_ORDER = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"] as const;
  const provinceStats: ProvinceStat[] = PROVINCE_ORDER.map((prov) => {
    const cs = constituencies.filter((c) => c.province.includes(prov));
    const declared = cs.filter((c) => c.countingStatus === "complete").length;
    const counting = cs.filter((c) => c.countingStatus === "counting").length;
    const partyMap = new Map<string, { name: string; color: string; won: number; leading: number }>();
    for (const c of cs) {
      const cand = c.candidates[0];
      if (!cand || cand.votes === 0) continue;
      const key = cand.partySlug;
      const existing = partyMap.get(key) ?? { name: cand.party, color: cand.partyColor, won: 0, leading: 0 };
      if (c.countingStatus === "complete") existing.won++;
      else if (c.countingStatus === "counting") existing.leading++;
      partyMap.set(key, existing);
    }
    const topParties = [...partyMap.entries()]
      .sort((a, b) => (b[1].won + b[1].leading) - (a[1].won + a[1].leading))
      .slice(0, 3)
      .map(([slug, p]) => ({ slug, ...p }));
    return { name: prov, total: cs.length, declared, counting, topParties };
  });

  // Recently declared — sorted by lastUpdated desc
  const recentlyDeclared = [...complete]
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Nepal 2082 General Election Results",
    description: "Live constituency-wise vote counts and party standings for Nepal's 2082 BS general elections.",
    url: "https://election.rusil.me",
    keywords: "Nepal election, 2082, vote count, constituency results",
    temporalCoverage: "2082",
    spatialCoverage: { "@type": "Place", name: "Nepal" },
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Live ticker */}
      <LiveTicker constituencies={constituencies} />

      <SiteNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10">

        {/* SEO H1 — visually small but semantically correct */}
        <h1 className="sr-only">Nepal 2082 General Election Results — Live Vote Count</h1>

        {/* Live controls bar */}
        <div className="flex items-center justify-end gap-2">
          <LiveBadge counting={counting.length > 0} size="sm" />
          <RefreshButton />
        </div>

        {/* Featured constituency hero */}
        {featured && (
          <section aria-label={`Featured: ${featured.name} constituency`}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Featured · {featured.name}
              </h2>
            </div>
            <HeroConstituency constituency={featured} />
          </section>
        )}

        {/* National overview + progress bar */}
        <section aria-label="National election overview">
          <NationalOverview stats={national} />
        </section>

        {/* Province breakdown */}
        <section aria-label="Province-level results">
          <div className="flex items-center gap-2 mb-3">
            <Globe2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              By Province
            </h2>
          </div>
          <ProvinceBreakdown provinces={provinceStats} />
        </section>

        {/* Party standings */}
        {national.partySeats.length > 0 && (
          <section aria-label="Party standings">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Party Standings
              </h2>
              <span className="text-xs text-muted-foreground ml-1">won + leading</span>
            </div>

            <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-5">
              {/* Parliament bar */}
              <PartySeatsChart partySeats={national.partySeats} />

              {/* Party rows */}
              <div className="divide-y">
                {national.partySeats.map((p, i) => {
                  const total = p.seats + p.leading;
                  const majorityPct = Math.min((total / 83) * 100, 100);
                  return (
                    <div key={`${p.partySlug}-${i}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      {/* Color swatch */}
                      <span
                        className="w-3 h-8 rounded-sm shrink-0"
                        style={{ backgroundColor: p.partyColor }}
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{p.party}</span>
                          {p.partyNepali && (
                            <span className="text-xs text-muted-foreground shrink-0">{p.partyNepali}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${majorityPct}%`, backgroundColor: p.partyColor }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-14 text-right">
                            {total} of 165
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 min-w-14">
                        <p className="text-xl font-black tabular-nums leading-none" style={{ color: p.partyColor }}>{total}</p>
                        <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                          <span className="text-emerald-600 dark:text-emerald-400">{p.seats}</span>
                          <span className="opacity-50"> + </span>
                          <span className="text-amber-600 dark:text-amber-400">{p.leading}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground border-t pt-3 leading-relaxed">
                165 FPTP seats · FPTP majority: 83 · govt. formation needs 138 of 275 total seats (165 FPTP + 110 PR)
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> · </span>
                <span className="text-emerald-600 dark:text-emerald-400">green</span> = won ·{" "}
                <span className="text-amber-600 dark:text-amber-400">amber</span> = leading
              </p>
            </div>
          </section>
        )}

        {/* Recently declared */}
        {recentlyDeclared.length > 0 && (
          <section aria-label="Recently declared results">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recently Declared
              </h2>
              <span className="ml-auto text-xs text-muted-foreground">{complete.length} total declared</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1 scrollbar-hide">
              {recentlyDeclared.map((c) => {
                const winner = c.winner ?? c.candidates[0];
                const runnerUp = c.candidates[1];
                const margin = winner && runnerUp ? winner.votes - runnerUp.votes : 0;
                return (
                  <Link
                    key={c.id}
                    href={`/constituency/${c.slug}`}
                    className="snap-start shrink-0 w-48 rounded-xl border bg-card hover:shadow-md hover:border-foreground/20 transition-all p-3.5 space-y-2.5"
                  >
                    <div>
                      <p className="font-semibold text-sm leading-tight truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.district}</p>
                    </div>
                    {winner && (
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: winner.partyColor }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{winner.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{winner.party}</p>
                        </div>
                      </div>
                    )}
                    {margin > 0 && (
                      <p className="text-[10px] text-muted-foreground border-t pt-2">
                        <span className="font-semibold text-foreground">{margin.toLocaleString()}</span>{" "}
                        vote margin
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Hot seats */}
        <HotSeats constituencies={constituencies} />

        {/* All constituencies */}
        <section aria-label="All constituencies">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              All 165 Constituencies
            </h2>
          </div>
          <ConstituencyList
            constituencies={constituencies}
            counting={counting}
            complete={complete}
          />
        </section>
      </main>

      <footer className="border-t mt-16 py-8 text-center text-xs text-muted-foreground space-y-1.5">
        <p>
          Data sourced from{" "}
          <a href="https://election.onlinekhabar.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            OnlineKhabar Election
          </a>
          {" "}·{" "}
          <a href="https://result.election.gov.np" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            Nepal Election Commission
          </a>
        </p>
        <p>Refreshes every 30 seconds · नेपाल निर्वाचन आयोग · Nepal 2082 BS</p>
        <p className="pt-1">
          built with ❤️ by{" "}
          <a
            href="https://rusil.me"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground/70 hover:text-foreground transition-colors underline underline-offset-2"
          >
            rusil
          </a>
        </p>
      </footer>
    </div>
  );
}