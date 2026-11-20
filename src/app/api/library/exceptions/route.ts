import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const newExc = {
    id: "exc-" + Date.now(),
    personName: body.personName || "Staff Member",
    personRole: body.personRole || "Duty officer",
    exception: body.exception || "Operations Manual · view",
    grantedBy: body.grantedBy || "Obi (MD)",
    until: body.until || "No end",
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, data: newExc, message: "Exception added" });
}
