import { NextResponse } from "next/server";
import { defaultFinancialHealth } from "@/data/overviewData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: defaultFinancialHealth
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load financial health" },
      { status: 500 }
    );
  }
}
