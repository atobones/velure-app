import { NextResponse } from "next/server";
import { undoStamp } from "@/lib/loyalty";
import { requireStaff } from "@/lib/staff-api";

export async function POST(req: Request) {
  const s = await requireStaff();
  if (s instanceof NextResponse) return s;
  const body = await req.json().catch(() => ({}));
  const ok = undoStamp(Number(body.eventId));
  return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "Nie można już cofnąć." }, { status: 409 });
}
