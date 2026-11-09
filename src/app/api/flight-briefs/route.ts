import { NextResponse } from "next/server";
import { initialBookings } from "@/data/initialBookings";
import { Booking } from "@/types/aviation";

// In-memory / persistent server-side store fallback for flight briefs
let serverFlightBriefs: Booking[] = [...initialBookings];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const status = searchParams.get("status");

    let result = serverFlightBriefs.filter((b) => b.tripNumber && b.legs && b.legs.length > 0);

    if (status && status !== "all") {
      result = result.filter((b) => {
        if (status === "confirmed") return b.status === "confirmed";
        if (status === "dispatched") return b.status === "dispatched" || b.status === "in_flight";
        if (status === "completed") return b.status === "completed" || b.status === "flown";
        return true;
      });
    }

    if (search) {
      result = result.filter((b) =>
        (b.tripNumber || "").toLowerCase().includes(search) ||
        (b.client?.fullName || "").toLowerCase().includes(search) ||
        (b.aircraft?.name || "").toLowerCase().includes(search) ||
        (b.aircraft?.registration || "").toLowerCase().includes(search) ||
        (b.legs || []).some(
          (l) =>
            (l.origin?.icao || "").toLowerCase().includes(search) ||
            (l.destination?.icao || "").toLowerCase().includes(search) ||
            (l.origin?.city || "").toLowerCase().includes(search) ||
            (l.destination?.city || "").toLowerCase().includes(search)
        )
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch flight briefs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Missing flight brief payload" },
        { status: 400 }
      );
    }

    const bookingId = payload.id || `booking-brief-${Date.now()}`;
    const tripNumber = payload.tripNumber || `PEU${Math.floor(100 + Math.random() * 899)}-001`;

    const updatedBooking: Booking = {
      ...payload,
      id: bookingId,
      tripNumber,
      status: payload.status || "confirmed",
      updatedAt: new Date().toISOString()
    };

    // Upsert into server storage
    const existingIndex = serverFlightBriefs.findIndex((b) => b.id === bookingId || b.tripNumber === tripNumber);
    if (existingIndex >= 0) {
      serverFlightBriefs[existingIndex] = {
        ...serverFlightBriefs[existingIndex],
        ...updatedBooking
      };
    } else {
      serverFlightBriefs.unshift(updatedBooking);
    }

    return NextResponse.json({
      success: true,
      message: `Flight Brief for Trip #${tripNumber} successfully prepared for operational dispatch.`,
      data: updatedBooking
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create flight brief" },
      { status: 500 }
    );
  }
}
