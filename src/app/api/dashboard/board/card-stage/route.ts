import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Fallback when the backend can't be reached: the move is refused so the board puts the card back. */
export async function PATCH() {
  return NextResponse.json(
    { success: false, message: "The server can't be reached, so the card was not moved. Try again in a moment." },
    { status: 503 }
  );
}
