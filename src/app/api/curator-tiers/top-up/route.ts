import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const topUpEntry = {
    curatorId: body.curatorId || "CUR-07",
    curatorName: body.curatorName || "No. 07",
    tokensAdded: Number(body.tokensAdded) || 6,
    grantedBy: body.grantedBy || "Obi (MD)",
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  };

  return NextResponse.json({
    success: true,
    data: topUpEntry,
    message: `Added ${topUpEntry.tokensAdded} tokens to ${topUpEntry.curatorName}`,
  });
}
