import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ExternalLink, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Data Sources",
  description: "Where the Nepal 2082 election data comes from — OnlineKhabar, Nepal Election Commission, and how sources are merged.",
};

const SOURCES = [
  {
    name: "OnlineKhabar Election Portal",
    url: "https://election.onlinekhabar.com",
    coverage: "36 key constituencies",
    updateFreq: "Near-realtime (scraped every 30s)",
    quality: "primary",
    qualityLabel: "Primary",
    notes: [
      "Live Devanagari vote counts broken down by candidate",
      "Covers high-interest constituencies: Jhapa-1–5, Kathmandu-1/3/4/5/8/9, Lalitpur-2/3, Chitwan-2/3, Bara-1/3, Bhaktapur-2, and more",
      "Party standings API provides live won + leading counts for all parties nationally",
      "Used as the authoritative source for its 36 constituencies — always preferred over other sources",
    ],
  },
  {
    name: "Nepal Election Commission",
    url: "https://result.election.gov.np",
    coverage: "All 165 FPTP constituencies (structure)",
    updateFreq: "Varies by constituency",
    quality: "base",
    qualityLabel: "Base structure",
    notes: [
      "Official government source — authoritative for final declared results",
      "Provides candidate names, party names, registered voter counts for all 165 constituencies",
      "Used as the structural base for all constituencies not covered by OnlineKhabar",
      "R2-hosted JSON mirror is used for fast fetching",
    ],
  },
  {
    name: "Ekantipur Election",
    url: "https://election.ekantipur.com",
    coverage: "~17 featured constituencies",
    updateFreq: "Scraped every 30s",
    quality: "secondary",
    qualityLabel: "Secondary",
    notes: [
      "English candidate names and live vote counts for featured constituencies",
      "Used as a secondary source where it has better data than the base",
      "Helpful for name normalisation and cross-referencing",
    ],
  },
];

const MERGE_LOGIC = [
  { step: "1", label: "Fetch all three sources in parallel", detail: "OnlineKhabar HTML, Ekantipur JS blob, and Election Commission JSON are fetched simultaneously." },
  { step: "2", label: "Build constituency map from R2 base", detail: "All 165 constituencies with their candidate structures are loaded from the Election Commission mirror." },
  { step: "3", label: "Patch with OnlineKhabar (37 constituencies)", detail: "For any constituency OnlineKhabar covers, its live vote counts replace the base data — unconditionally. OKhar is always trusted as the live source." },
  { step: "4", label: "Patch with Ekantipur where better", detail: "Ekantipur data is applied to constituencies it covers if the total vote count is higher than what OKhar or R2 has." },
  { step: "5", label: "Re-derive status and totals", detail: "Counting status, totals, and percentages are recalculated from the merged data. Party standings are updated from the OKhar live API." },
  { step: "6", label: "Cache for 30 seconds", detail: "The merged result is cached in-process. Requests within 30 seconds get the cached copy. Next.js ISR revalidates static pages every 30s." },
];

const qualityStyles: Record<string, string> = {
  primary: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
  base: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
  secondary: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-700",
};

export default function SourcesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-12">

        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Data Sources</h1>
          <p className="text-muted-foreground">
            Where the data comes from and how it&apos;s combined.
          </p>
        </div>

        {/* Sources */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Sources</h2>
          <div className="space-y-4">
            {SOURCES.map((s) => (
              <div key={s.name} className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{s.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${qualityStyles[s.quality]}`}>
                        {s.qualityLabel}
                      </span>
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5 w-fit"
                    >
                      {s.url.replace("https://", "")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {s.coverage}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {s.updateFreq}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {s.notes.map((note) => (
                    <li key={note} className="text-sm text-muted-foreground flex gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Merge logic */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">How sources are merged</h2>
          <div className="space-y-2">
            {MERGE_LOGIC.map(({ step, label, detail }) => (
              <div key={step} className="flex gap-4 p-4 rounded-xl border bg-card">
                <span className="w-6 h-6 rounded-full bg-foreground/8 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                  {step}
                </span>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Accuracy note */}
        <section className="p-4 rounded-xl border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-medium">Accuracy note</p>
            <p className="leading-relaxed">
              This site is unofficial. Data depends on third-party portals which may have their own delays or errors.
              For official certified results, refer to the{" "}
              <a
                href="https://result.election.gov.np"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Nepal Election Commission
              </a>.
            </p>
          </div>
        </section>

        <section className="flex flex-wrap gap-3 pt-2 border-t">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to results</Link>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About →</Link>
          <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ →</Link>
        </section>

      </main>
    </div>
  );
}
