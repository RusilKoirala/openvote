import { NextResponse } from "next/server";
import { getElectionData } from "@/lib/data";

// ISR: revalidate every 60 seconds on-demand
export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getElectionData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
