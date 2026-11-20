import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      dueNowCount: 3,
      dueNowLabel: "needs manual send / review",
      scheduled24hCount: 21,
      scheduled24hLabel: "across 8 trips",
      sent7dCount: 188,
      sent7dLabel: "WhatsApp 161 · email 27",
      deliveryFailedCount: 1,
      deliveryFailedLabel: "invalid WhatsApp number",
    },
  });
}
