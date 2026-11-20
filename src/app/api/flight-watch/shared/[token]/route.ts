import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  return NextResponse.json({
    success: true,
    data: {
      tripNumber: "FE4578",
      aircraft: "Phenom 300E (D-IOBA)",
      route: "LEIB (Ibiza) → LSGG (Geneva)",
      status: "Airborne · on time",
      altitude: "FL410",
      distanceRemainingKm: 210,
      scheduledDeparture: "08:30 UTC",
      estimatedArrival: "10:05 UTC",
      expiresNotice: "Expires 2 hours after landing",
    },
  });
}
