import { NextResponse } from "next/server";
import { initialBookings } from "@/data/initialBookings";
import { Booking } from "@/types/aviation";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body = await request.json().catch(() => ({}));
    const signatoryName = body.signatoryName || "Authorized Signatory";

    return NextResponse.json({
      success: true,
      message: `Master Charter Agreement for booking ${bookingId} officially signed and executed by ${signatoryName}.`,
      data: {
        bookingId,
        isContractSigned: true,
        contractSignedBy: signatoryName,
        contractSignedDate: new Date().toLocaleDateString("de-DE"),
        status: "confirmed"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sign contract" },
      { status: 500 }
    );
  }
}
