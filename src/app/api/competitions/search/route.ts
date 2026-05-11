import { NextResponse } from "next/server";

import { MinGolfError, searchCompetitions } from "@/lib/min-golf/api";
import type { SearchFilters } from "@/lib/min-golf/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let filters: SearchFilters;

  try {
    filters = (await request.json()) as SearchFilters;
  } catch {
    return NextResponse.json(
      { error: "Ogiltig sökförfrågan." },
      { status: 400 },
    );
  }

  try {
    const result = await searchCompetitions(filters);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "s-maxage=120, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const status = error instanceof MinGolfError ? error.status : 500;
    return NextResponse.json(
      { error: "Kunde inte söka tävlingar just nu." },
      { status },
    );
  }
}
