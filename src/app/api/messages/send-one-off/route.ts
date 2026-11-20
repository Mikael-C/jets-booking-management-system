import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const queueItem = {
    id: "q-" + Date.now(),
    automationCode: "ONE-OFF",
    tripNumber: body.tripNumber || "MANUAL",
    recipientName: body.recipient || "Recipient",
    recipientContact: body.recipient || "Direct",
    channel: body.channel || "WhatsApp",
    status: "sent",
    content: body.content || "",
    sentAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, data: queueItem, message: "Message dispatched successfully" });
}
