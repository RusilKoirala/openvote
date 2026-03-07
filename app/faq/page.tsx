import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Nepal's 2082 BS election — the electoral system, seat counts, PR vs FPTP, and how results are counted.",
};

const FAQS = [
  {
    q: "When did the 2082 election take place?",
    a: "Nepal's 2082 BS general elections were held in early 2026 (2082 Bikram Sambat). Counting began immediately after polling closed and results are declared on a rolling basis as votes are tallied at constituency level.",
  },
  {
    q: "What is the difference between FPTP and PR seats?",
    a: "Nepal uses a mixed electoral system. 165 seats are First-Past-The-Post (FPTP) — the candidate with the most votes in each constituency wins, regardless of margin. 110 seats are Proportional Representation (PR) — allocated based on each party's national vote share. This site tracks FPTP results only.",
  },
  {
    q: "How many seats are needed to form a government?",
    a: "Nepal's House of Representatives has 275 total seats (165 FPTP + 110 PR). A simple majority of 138 seats is required to form a government. No party is likely to win 138 FPTP seats alone — coalition-building across FPTP and PR seats is the norm.",
  },
  {
    q: "What does the majority line (83) in the party chart mean?",
    a: "83 is the majority of the 165 FPTP seats shown in this chart (165 ÷ 2 + 1 = 83). It helps compare relative FPTP dominance, but it doesn't represent the real majority needed to govern. Actual government formation requires 138 of all 275 seats including PR.",
  },
  {
    q: "Why do some constituencies show very low vote counts?",
    a: "Counting starts immediately after polling but results trickle in over several hours. Constituencies that opened counting later or are in remote areas may show low or zero counts while others are further along. The site refreshes every 30 seconds.",
  },
  {
    q: "Why does the turnout percentage look low (e.g. 3%)?",
    a: "Early in counting, only a fraction of ballots have been counted and reported. The 'turnout' shown is actually the percentage of registered voters whose ballots have been counted so far — not the final voter turnout. As counting progresses, this number will rise significantly.",
  },
  {
    q: "What does 'Hot Seats' mean?",
    a: "Hot seats are constituencies where the margin between the leading candidate and the second-place candidate is less than 15% of the leader's votes — a tight race that could still swing either way. These are sorted by margin (tightest first).",
  },
  {
    q: "How often does the data refresh?",
    a: "The site fetches fresh data every 30 seconds from OnlineKhabar Election and the Nepal Election Commission. Your browser also auto-refreshes the data without a full page reload. You can manually trigger a refresh using the refresh button in the top right.",
  },
  {
    q: "Which parties are in this election?",
    a: "Major parties contesting include Nepali Congress (NC), CPN (Unified Marxist-Leninist) / UML, CPN (Maoist Centre) / MC, Rastriya Swatantra Party (RSP), Rastriya Prajatantra Party (RPP), Janamat Party, Nagarik Unmukti Party (NUP), and various independent candidates.",
  },
  {
    q: "Why don't all 165 constituencies have live data?",
    a: "OnlineKhabar's portal covers around 36 key constituencies with live data. For the remaining constituencies, data comes from the Election Commission's result feed, which may update less frequently. Constituencies showing 'Not Started' simply haven't begun publicly reporting counts yet.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-10">

        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">FAQ</h1>
          <p className="text-muted-foreground">
            Common questions about Nepal&apos;s 2082 election and this website.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group rounded-xl border bg-card overflow-hidden">
              <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none select-none hover:bg-muted/40 transition-colors">
                <span className="font-medium text-sm leading-snug">{q}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4 pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            </details>
          ))}
        </div>

        <section className="flex flex-wrap gap-3 pt-2 border-t">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to results</Link>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About →</Link>
          <Link href="/sources" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Data sources →</Link>
        </section>

      </main>
    </div>
  );
}
