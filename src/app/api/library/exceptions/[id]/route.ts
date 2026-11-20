import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ success: true, message: `Exception ${params.id} removed` });
}
