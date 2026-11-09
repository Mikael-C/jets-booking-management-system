import { NextResponse } from "next/server";
import { initialBookings } from "@/data/initialBookings";
import { Booking } from "@/types/aviation";

// In-memory / persistent server-side store fallback for invoices
let serverInvoices: Booking[] = [...initialBookings];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const status = searchParams.get("status");

    let result = serverInvoices.filter((b) => b.invoiceNumber);

    if (status && status !== "all") {
      result = result.filter((b) => {
        if (status === "paid") return b.paymentStatus === "fully_paid";
        if (status === "unpaid") return b.paymentStatus === "unpaid";
        if (status === "overdue") return b.paymentStatus === "overdue";
        if (status === "deposit") return b.paymentStatus === "deposit_paid";
        return true;
      });
    }

    if (search) {
      result = result.filter((b) =>
        (b.invoiceNumber || "").toLowerCase().includes(search) ||
        (b.tripNumber || "").toLowerCase().includes(search) ||
        (b.client?.fullName || "").toLowerCase().includes(search) ||
        (b.accountNumber || "").toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Missing invoice payload" },
        { status: 400 }
      );
    }

    const bookingId = payload.id || `booking-inv-${Date.now()}`;
    const invoiceNumber = payload.invoiceNumber || `0010${Math.floor(6020 + Math.random() * 3970)}`;
    const tripNumber = payload.tripNumber || `PEU${Math.floor(100 + Math.random() * 899)}-001`;

    const updatedBooking: Booking = {
      ...payload,
      id: bookingId,
      invoiceNumber,
      tripNumber,
      accountNumber: payload.accountNumber || "ACC-21737",
      contractDate: payload.contractDate || new Date().toLocaleDateString("de-DE"),
      paymentDueDate: payload.paymentDueDate || new Date(Date.now() + 86400000 * 3).toLocaleDateString("de-DE"),
      status: payload.status || "confirmed",
      paymentStatus: payload.paymentStatus || "unpaid",
      updatedAt: new Date().toISOString()
    };

    // Upsert into server storage
    const existingIndex = serverInvoices.findIndex((b) => b.id === bookingId || b.invoiceNumber === invoiceNumber);
    if (existingIndex >= 0) {
      serverInvoices[existingIndex] = {
        ...serverInvoices[existingIndex],
        ...updatedBooking
      };
    } else {
      serverInvoices.unshift(updatedBooking);
    }

    return NextResponse.json({
      success: true,
      message: `Commercial Invoice #${invoiceNumber} successfully compiled and recorded.`,
      data: updatedBooking
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}
