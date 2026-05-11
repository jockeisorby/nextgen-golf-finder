import { NextResponse } from "next/server";

import { getCompetitionDetail, MinGolfError } from "@/lib/min-golf/api";

export const runtime = "nodejs";
export const revalidate = 600;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const detail = await getCompetitionDetail(id);
    return NextResponse.json(detail, {
      headers: {
        "Cache-Control": "s-maxage=600, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const status = error instanceof MinGolfError ? error.status : 500;
    return NextResponse.json(
      { error: "Kunde inte hämta tävlingen från Min Golf." },
      { status },
    );
  }
}
