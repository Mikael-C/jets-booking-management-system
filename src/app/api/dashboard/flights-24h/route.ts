import { NextResponse } from "next/server";
import { defaultFlights } from "@/data/overviewData";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter");

    let items = [...defaultFlights];
    if (filter === "today") {
      items = items.filter((f) => f.dateGroup === "today");
    }

    return NextResponse.json({
      success: true,
      data: {
        totalCount: items.length,
        items
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load flights" },
      { status: 500 }
    );
  }
}
