import { NextResponse } from "next/server";

let alertRules = {
  departureDelayMinutes: 15,
  departureTemplateCode: "FW-02",
  squawkAlertNotification: "FW-04 to duty officer and MD",
  noPositionCallMinutes: 20,
};

export async function GET() {
  return NextResponse.json({ success: true, data: alertRules });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  alertRules = { ...alertRules, ...body };
  return NextResponse.json({ success: true, data: alertRules, message: "Alert rules updated" });
}
