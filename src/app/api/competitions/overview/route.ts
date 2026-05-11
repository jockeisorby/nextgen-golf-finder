import { NextResponse } from "next/server";

import { getSearchOverview, MinGolfError } from "@/lib/min-golf/api";

export const runtime = "nodejs";
export const revalidate = 86_400;

export async function GET() {
  try {
    const overview = await getSearchOverview();
    return NextResponse.json(overview, {
      headers: {
        "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    const status = error instanceof MinGolfError ? error.status : 500;
    return NextResponse.json(
      { error: "Kunde inte hämta filterdata från Min Golf." },
      { status },
    );
  }
}
