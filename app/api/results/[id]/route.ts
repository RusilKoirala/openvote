import { NextResponse } from "next/server";
import { getConstituency } from "@/lib/data";

export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getConstituency(id);

  if (!data) {
    return NextResponse.json({ error: "Constituency not found" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
