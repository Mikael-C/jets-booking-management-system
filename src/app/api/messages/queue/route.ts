import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let queueItems = [
  {
    id: "q-1",
    automationCode: "PAY-02",
    tripNumber: "FE4578",
    recipientName: "Adeyemi Holdings",
    recipientContact: "+44 7700 900123",
    channel: "WhatsApp",
    status: "due_now",
    content: "Kind reminder: invoice INV-FE4578-01 (€ 8,250.00) is due Wed 18 Nov. Your aircraft is confirmed to the operator once payment arrives.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q-2",
    automationCode: "OPS-01",
    tripNumber: "RB3310",
    recipientName: "Jean-Luc Dupont",
    recipientContact: "+33 6 12 34 56 78",
    channel: "WhatsApp",
    status: "due_now",
    content: "Please submit missing passport information for your flight LFPB -> LIML.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q-3",
    automationCode: "BKG-02",
    tripNumber: "MX5521",
    recipientName: "Tariq Al-Mansoor",
    recipientContact: "+971 50 123 4567",
    channel: "Email",
    status: "due_now",
    content: "Reminder: Charter agreement awaiting signature for flight LFPB -> DNAA.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q-4",
    automationCode: "OPS-08",
    tripNumber: "TA2201",
    recipientName: "Chief Emeka Okoye",
    recipientContact: "+234 803 123 4567",
    channel: "WhatsApp",
    status: "failed",
    failureReason: "Invalid WhatsApp phone number format (+234 0803...)",
    content: "Flight brief published for flight DNMM -> DNAA.",
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let filtered = [...queueItems];
  if (status) {
    filtered = filtered.filter((q) => q.status === status);
  }

  return NextResponse.json({ success: true, data: filtered });
}
