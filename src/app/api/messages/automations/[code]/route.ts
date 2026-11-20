import { NextResponse } from "next/server";

const mockTemplates: Record<string, any> = {
  "PAY-02": {
    code: "PAY-02",
    title: "Payment reminder",
    group: "Booking & payment",
    triggerDescription: "Invoice status is Unpaid",
    whenSchedule: "48 h before due · 24 h before due · on due date 09:00 recipient's time",
    scheduleDetail: "48 h before due · 24 h before due · on due date 09:00 recipient's time",
    stopCondition: "Invoice paid, credit-noted or trip cancelled",
    quietHours: "No sends 21:00–07:00 recipient's time; move to 07:00",
    approval: "Automatic (no approval)",
    appliesTo: "All trips · Curator and direct",
    toRecipient: "Billing contact on the account",
    copyRecipient: "Curator on the trip (summary only, no bank details)",
    fallback: "If no WhatsApp opt-in: email only",
    language: "English",
    channel: "Email + WhatsApp",
    status: true,
    textWhatsApp: "Kind reminder: invoice {invoice.id} ({invoice.total}) is due {invoice.due_date}. Your aircraft is confirmed to the operator once payment arrives. {link.pay}",
    textEmailSubject: "Reminder: Invoice {invoice.id} due {invoice.due_date}",
    textEmailBody: "Dear {client.first_name},\n\nKind reminder: invoice {invoice.id} ({invoice.total}) is due {invoice.due_date}. Your aircraft is confirmed to the operator once payment arrives.\n\nView invoice: {link.pay}",
    textCuratorCopy: "Curator notification: Reminder sent for {invoice.id} ({invoice.total}) on trip {trip.id}.",
    metaStatus: "Approved by Meta · utility",
    statsSent30d: 42,
    statsDelivered30d: 40,
    statsRead30d: 31,
    statsConversionRatePct: 68,
  },
};

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const template = mockTemplates[code] || {
    code,
    title: `${code} Automation`,
    group: "Booking & payment",
    triggerDescription: "Automated trigger for " + code,
    whenSchedule: "Immediately",
    scheduleDetail: "Immediately upon trigger",
    stopCondition: "Action completed",
    quietHours: "No sends 21:00–07:00",
    approval: "Automatic (no approval)",
    appliesTo: "All trips",
    toRecipient: "Client",
    copyRecipient: "Curator",
    fallback: "Email fallback",
    language: "English",
    channel: "Email + WhatsApp",
    status: true,
    textWhatsApp: `Notification regarding ${code}: your trip updates are ready.`,
    textEmailSubject: `Update on ${code}`,
    textEmailBody: `Hello {client.first_name},\n\nThis is an automated update regarding ${code}.`,
    textCuratorCopy: `Internal update regarding ${code}.`,
    metaStatus: "Approved by Meta · utility",
    statsSent30d: 28,
    statsDelivered30d: 28,
    statsRead30d: 24,
    statsConversionRatePct: 75,
  };

  return NextResponse.json({ success: true, data: template });
}

export async function PUT(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const body = await req.json().catch(() => ({}));
  mockTemplates[code] = { ...(mockTemplates[code] || {}), ...body, code };
  return NextResponse.json({ success: true, data: mockTemplates[code], message: "Template saved successfully" });
}
