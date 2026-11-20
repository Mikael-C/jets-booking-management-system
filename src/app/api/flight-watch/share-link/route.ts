import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = "flw_" + Math.random().toString(36).substring(2, 10);
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  return NextResponse.json({
    success: true,
    data: {
      token,
      expiresAt,
      tripNumber: body.tripNumber || "FE4578-005",
      url: `/live-flight/${token}`,
    },
  });
}
