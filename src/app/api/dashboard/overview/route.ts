import { NextResponse } from "next/server";
import {
  defaultFinancialHealth,
  defaultFlights,
  defaultNeedsAction
} from "@/data/overviewData";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe");
    const assignee = searchParams.get("assignee");

    let flights = [...defaultFlights];
    if (timeframe === "today") {
      flights = flights.filter((f) => f.dateGroup === "today");
    }

    let needsAction = [...defaultNeedsAction];
    if (assignee === "mine") {
      needsAction = needsAction.filter((n) => n.isMine);
    }

    const tripsByStage = {
      request: 2,
      sourcing: 1,
      quoted: 2,
      booked: 1,
      confirmed: 1,
      flownClose: 1
    };

    return NextResponse.json({
      success: true,
      data: {
        financialHealth: defaultFinancialHealth,
        flights: {
          totalCount: flights.length,
          items: flights
        },
        needsAction: {
          totalCount: needsAction.length,
          items: needsAction
        },
        tripsByStage
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load overview data" },
      { status: 500 }
    );
  }
}
