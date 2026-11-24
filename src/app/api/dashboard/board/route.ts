import { NextResponse } from "next/server";
import { emptyFinancialHealth } from "@/data/overviewData";

export const dynamic = "force-dynamic";

/**
 * Fallback used only when the backend (/api/dashboard/board on the Express server) can't be reached.
 * It returns no demo data: the Overview shows an "offline" notice instead of made-up cards.
 */
export async function GET() {
  const stages = [
    ["request", "REQUEST"],
    ["sourcing", "SOURCING"],
    ["quoted", "QUOTED"],
    ["booked", "BOOKED"],
    ["confirmed", "CONFIRMED"],
    ["flown_close", "FLOWN · CLOSE"]
  ];
  return NextResponse.json({
    success: true,
    offline: true,
    data: {
      financialHealth: emptyFinancialHealth,
      columns: stages.map(([id, title]) => ({ id, title, count: 0, cards: [] })),
      totalCards: 0
    }
  });
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, message: "The server can't be reached, so the card was not moved. Try again in a moment." },
    { status: 503 }
  );
}
