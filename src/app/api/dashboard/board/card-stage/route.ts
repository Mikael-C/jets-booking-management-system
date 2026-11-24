import { NextResponse } from "next/server";
import { PATCH as boardPatch } from "../route";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  return boardPatch(request);
}
