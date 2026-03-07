import { NextRequest, NextResponse } from "next/server";
import { scrapeElectionData, scrapeFromR2 } from "@/lib/scraper";
import { saveElectionData } from "@/lib/data";

/**
 * Triggered by a cron job or manual call with a secret token.
 * source=r2 → use nepalvotes.live R2 bucket (globally accessible)
 * source=ecs → use Election Commission site (Nepal IP only)
 * 
 * Call: GET /api/scrape?token=YOUR_SCRAPE_SECRET[&source=r2]
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.SCRAPE_SECRET;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const source = req.nextUrl.searchParams.get("source") ?? "r2";

  try {
    const data = source === "r2"
      ? await scrapeFromR2()
      : await scrapeElectionData();

    if (!data) {
      return NextResponse.json(
        { error: "No data returned from source", source },
        { status: 503 }
      );
    }

    await saveElectionData(data);
    return NextResponse.json({
      ok: true,
      source,
      constituencies: data.constituencies.length,
      counting: data.national.counting,
      scrapedAt: data.scrapedAt,
    });
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
  }
}
