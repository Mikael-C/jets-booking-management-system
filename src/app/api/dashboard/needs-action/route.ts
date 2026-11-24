import { NextResponse } from "next/server";
import { defaultNeedsAction } from "@/data/overviewData";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter");

    let items = [...defaultNeedsAction];
    if (filter === "mine") {
      items = items.filter((n) => n.isMine);
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
      { success: false, message: error.message || "Failed to load needs action" },
      { status: 500 }
    );
  }
}
