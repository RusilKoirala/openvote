import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ExternalLink, Database, RefreshCw, Code2, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "About this Nepal 2082 election results tracker — how it works, who built it, and where the data comes from.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-12">

        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">About</h1>
          <p className="text-muted-foreground">
            An independent live tracker for Nepal&apos;s 2082 BS general election results.
          </p>
        </div>

        {/* What is this */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">What is this?</h2>
          <p className="text-muted-foreground leading-relaxed">
            This site aggregates live vote counts for all <strong className="text-foreground">165 FPTP constituencies</strong> across
            Nepal&apos;s 7 provinces. It refreshes every 30 seconds, pulling from multiple sources to give you
            the most up-to-date picture of how the 2082 BS (2025–26 AD) elections are unfolding.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Nepal uses a <strong className="text-foreground">mixed electoral system</strong> — 165 seats are elected
            via First-Past-The-Post (FPTP) from individual constituencies, and 110 seats are filled
            via Proportional Representation (PR). This site tracks the FPTP results. To form a government,
            a party or coalition needs <strong className="text-foreground">138 of 275 total seats</strong>.
          </p>
        </section>

        {/* How it works */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">How it works</h2>
          <div className="space-y-3">
            {[
              {
                icon: Database,
                title: "Live scraping",
                desc: "Every 30 seconds, the server fetches fresh data from OnlineKhabar's election portal for their 36 covered constituencies, and from the Nepal Election Commission's official result feed for all 165.",
              },
              {
                icon: RefreshCw,
                title: "Smart merging",
                desc: "Data from multiple sources is merged — OnlineKhabar is preferred as the live primary source where available, with the Election Commission as the base for all constituency structures.",
              },
              {
                icon: Globe,
                title: "Server-side rendering",
                desc: "Pages are server-rendered on demand with a 30s revalidation window. You always see fresh data without needing to manually refresh.",
              },
              {
                icon: Code2,
                title: "Open stack",
                desc: "Built with Next.js 16 App Router, Tailwind CSS, and TypeScript. Deployed on Vercel at the edge.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl border bg-card">
                <Icon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Disclaimer</h2>
          <div className="p-4 rounded-xl border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-sm text-amber-800 dark:text-amber-300 leading-relaxed space-y-2">
            <p>
              This is an <strong>unofficial</strong> tracker. All data is sourced from third-party portals
              and the Election Commission&apos;s public feeds. Accuracy depends on those sources.
            </p>
            <p>
              For official results, always refer to the{" "}
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

        {/* Built by */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Built by</h2>
          <p className="text-muted-foreground">
            Made with ❤️ by{" "}
            <a
              href="https://rusil.me"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
            >
              rusil
            </a>
            . Built quickly during election night to make results more accessible.
          </p>
        </section>

        {/* Links */}
        <section className="flex flex-wrap gap-3 pt-2 border-t">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to results</Link>
          <Link href="/sources" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Data sources →</Link>
          <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ →</Link>
        </section>

      </main>
    </div>
  );
}
