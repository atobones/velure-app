import { NextResponse } from "next/server";
import { findGuestByCode } from "@/lib/loyalty";
import { guestCard, requireStaff } from "@/lib/staff-api";

export async function POST(req: Request) {
  const s = await requireStaff();
  if (s instanceof NextResponse) return s;
  const body = await req.json().catch(() => ({}));
  const g = findGuestByCode(String(body.code ?? ""));
  if (!g) return NextResponse.json({ error: "Nie znamy tego numeru" }, { status: 404 });
  return NextResponse.json({ guest: guestCard(g) });
}
