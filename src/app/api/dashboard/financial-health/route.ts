import { NextResponse } from "next/server";
import { emptyFinancialHealth } from "@/data/overviewData";

export const dynamic = "force-dynamic";

/** Fallback when the backend can't be reached (no demo data). */
export async function GET() {
  return NextResponse.json({ success: true, offline: true, data: emptyFinancialHealth });
}
