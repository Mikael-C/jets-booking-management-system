import { NextResponse } from "next/server";
import { initialBookings } from "@/data/initialBookings";
import { Booking } from "@/types/aviation";

// In-memory / persistent server-side store fallback for contracts
let serverContracts: Booking[] = [...initialBookings];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const status = searchParams.get("status");

    let result = serverContracts.filter((b) => b.tripNumber || b.isContractSigned);

    if (status && status !== "all") {
      result = result.filter((b) => {
        if (status === "signed") return b.isContractSigned;
        if (status === "pending") return !b.isContractSigned;
        return true;
      });
    }

    if (search) {
      result = result.filter((b) =>
        (b.tripNumber || "").toLowerCase().includes(search) ||
        (b.client?.fullName || "").toLowerCase().includes(search) ||
        (b.aircraft?.name || "").toLowerCase().includes(search) ||
        `ca-${b.tripNumber || b.id}`.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Missing contract payload" },
        { status: 400 }
      );
    }

    const bookingId = payload.id || `booking-ca-${Date.now()}`;
    const tripNumber = payload.tripNumber || `PEU${Math.floor(100 + Math.random() * 899)}-001`;

    const updatedBooking: Booking = {
      ...payload,
      id: bookingId,
      tripNumber,
      contractDate: payload.contractDate || new Date().toLocaleDateString("de-DE"),
      status: payload.status || "confirmed",
      quoteStatus: "accepted",
      updatedAt: new Date().toISOString()
    };

    // Upsert into server storage
    const existingIndex = serverContracts.findIndex((b) => b.id === bookingId || b.tripNumber === tripNumber);
    if (existingIndex >= 0) {
      serverContracts[existingIndex] = {
        ...serverContracts[existingIndex],
        ...updatedBooking
      };
    } else {
      serverContracts.unshift(updatedBooking);
    }

    return NextResponse.json({
      success: true,
      message: `Master Charter Agreement for Trip #${tripNumber} successfully prepared and recorded.`,
      data: updatedBooking
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create contract" },
      { status: 500 }
    );
  }
}
