import { Booking } from "@/types/aviation";
import { api } from "@/lib/api";

/** A booking shaped so the invoice document prints this one invoice (number and amount). */
export function invoiceDocBooking(
  booking: Booking,
  inv: { number: string; amount: number; title?: string; description?: string; exact?: boolean }
): Booking {
  return {
    ...booking,
    invoiceNumber: inv.number,
    // exact: print this amount and wording even when the ledger holds the number with another amount
    ...(inv.exact ? { docInvoice: { amount: inv.amount, title: inv.title || "", description: inv.description || "" } } : {}),
    pricing: { ...booking.pricing, totalFlightPrice: inv.amount },
    totalWithCardFee: undefined
  };
}

/** A booking shaped so the credit-note document prints this one credit note. */
export function creditNoteDocBooking(booking: Booking, note: { number: string; amount: number; against?: string; reasonCategory?: string; internalNote?: string; issuedAt?: string }): Booking {
  const record = {
    id: note.number,
    number: note.number,
    creditNoteNumber: note.number,
    amount: Math.abs(note.amount),
    reason: note.reasonCategory || "Credit",
    appliesTo: note.against,
    issueDate: note.issuedAt ? new Date(note.issuedAt).toLocaleDateString("de-DE") : undefined,
    clientOwes: 0,
    weOweClient: Math.abs(note.amount),
    netBalance: -Math.abs(note.amount)
  };
  return { ...booking, creditNotes: [record as any, ...(booking.creditNotes || []).filter((c: any) => c.number !== note.number)] };
}

/** Finds the booking in memory, or loads it from the backend. */
export async function loadBooking(
  bookings: Booking[],
  bookingId: string,
  normalize: (raw: any) => Booking
): Promise<Booking | null> {
  const local = bookings.find((b) => b.id === bookingId);
  if (local) return local;
  try {
    const res = await api.bookings.get(bookingId);
    return res?.data ? normalize(res.data) : null;
  } catch {
    return null;
  }
}

export const money = (amount: number, currency = "EUR") => {
  const sym = currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "CHF" ? "CHF" : "€";
  const n = Number(amount) || 0;
  const s = Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `– ${sym} ${s}` : `${sym} ${s}`;
};

export const shortDay = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
