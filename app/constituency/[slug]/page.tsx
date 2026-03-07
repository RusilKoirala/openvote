import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Trophy, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoteBar } from "@/components/VoteBar";
import { StatusBadge } from "@/components/StatusBadge";
import { SiteNav } from "@/components/SiteNav";
import { getConstituency, getConstituencies } from "@/lib/data";

export const revalidate = 60;

// Pre-generate known constituency pages at build time
export async function generateStaticParams() {
  const constituencies = await getConstituencies();
  return constituencies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await getConstituency(slug);
  if (!c) return { title: "Constituency Not Found" };

  const leader = c.candidates.length > 0
    ? [...c.candidates].sort((a, b) => b.votes - a.votes)[0]
    : null;

  return {
    title: `${c.name} Election Results 2082 — Nepal`,
    description: leader
      ? `${c.name} constituency results: ${leader.name} (${leader.party}) leading with ${leader.votes.toLocaleString()} votes. ${c.countedPercentage}% counted.`
      : `${c.name} constituency (${c.district}, ${c.province}) — Nepal 2082 election results.`,
    openGraph: {
      title: `${c.name} Results — Nepal 2082`,
      description: `Live vote count for ${c.name} constituency, ${c.district}.`,
    },
  };
}

export default async function ConstituencyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await getConstituency(slug);

  if (!c) notFound();

  const sorted = [...c.candidates].sort((a, b) => b.votes - a.votes);
  const totalVotes = c.totalVotes;
  const isComplete = c.countingStatus === "complete";
  const winner = isComplete ? c.winner ?? sorted[0] : null;
  const leader = sorted[0];
  const margin = sorted.length > 1 ? sorted[0].votes - sorted[1].votes : 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav backLabel="All Results" breadcrumbTitle={c.name} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <MapPin className="w-3.5 h-3.5" />
            {c.district} · {c.province}
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{c.name}</h1>
              {c.nameNepali && (
                <p className="text-lg text-muted-foreground">{c.nameNepali}</p>
              )}
            </div>
            <StatusBadge status={c.countingStatus} className="mt-1 shrink-0" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Votes Counted"
            value={totalVotes.toLocaleString()}
          />
          {c.totalVoters && (
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Registered Voters"
              value={c.totalVoters.toLocaleString()}
            />
          )}
          {c.totalVoters && totalVotes > 0 && (
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="Turnout"
              value={`${Math.round((totalVotes / c.totalVoters) * 100)}%`}
            />
          )}
          {margin > 0 && leader && (
            <StatCard
              icon={<Trophy className="w-4 h-4" />}
              label={isComplete ? "Winning Margin" : "Current Lead"}
              value={margin.toLocaleString()}
              color={leader.partyColor}
            />
          )}
        </div>

        {/* Vote bar */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Vote Share
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VoteBar candidates={c.candidates} showLabels />
          </CardContent>
        </Card>

        {/* Candidate results */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Candidate Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sorted.map((candidate, i) => {
              const isWinner = winner?.id === candidate.id;
              const isLeader = !isComplete && i === 0;
              const pct = candidate.percentage;

              return (
                <div key={candidate.id} className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">
                      #{i + 1}
                    </span>

                    {/* Color dot */}
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: candidate.partyColor }}
                    />

                    {/* Name + party */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold truncate ${isWinner || isLeader ? "text-foreground" : "text-muted-foreground"}`}>
                          {candidate.name}
                        </span>
                        {isWinner && (
                          <Badge variant="secondary" className="gap-1 text-[10px] py-0 shrink-0">
                            <Trophy className="w-2.5 h-2.5 text-amber-500" />
                            Elected
                          </Badge>
                        )}
                        {isLeader && !isComplete && (
                          <Badge variant="outline" className="text-[10px] py-0 shrink-0 border-amber-400 text-amber-600">
                            Leading
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{candidate.party}</p>
                    </div>

                    {/* Votes */}
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${isWinner || isLeader ? "text-foreground" : "text-muted-foreground"}`}>
                        {candidate.votes.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{pct.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Individual vote bar */}
                  <div className="ml-8 h-2 sm:h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: candidate.partyColor,
                        opacity: isWinner || isLeader ? 1 : 0.5,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {c.candidates.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">
                Counting has not started yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Counting progress */}
        {c.countingStatus === "counting" && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Counting Progress</span>
                <span className="text-muted-foreground">{c.countedPercentage}% complete</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${c.countedPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(c.lastUpdated).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border p-3 space-y-1">
      <div className="text-muted-foreground">{icon}</div>
      <p className="text-xl font-bold" style={color ? { color } : undefined}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}
