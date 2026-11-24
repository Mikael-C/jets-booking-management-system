import { NextResponse } from "next/server";
import { emptyFinancialHealth } from "@/data/overviewData";

export const dynamic = "force-dynamic";

/** Fallback when the backend can't be reached: empty data flagged as offline (no demo figures). */
export async function GET() {
  return NextResponse.json({
    success: true,
    offline: true,
    data: {
      financialHealth: emptyFinancialHealth,
      flights: { totalCount: 0, items: [] },
      needsAction: { totalCount: 0, items: [] },
      tripsByStage: { request: 0, sourcing: 0, quoted: 0, booked: 0, confirmed: 0, flownClose: 0 }
    }
  });
}
