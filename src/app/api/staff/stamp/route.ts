import { NextResponse } from "next/server";
import { addStamps, applyReferralBonus, applyWeeklyChecks, getGuest } from "@/lib/loyalty";
import { guestCard, requireStaff } from "@/lib/staff-api";

export async function POST(req: Request) {
  const s = await requireStaff();
  if (s instanceof NextResponse) return s;
  const body = await req.json().catch(() => ({}));
  const count = Math.trunc(Number(body.count));
  const guestId = Number(body.guestId);
  if (!(count >= 1 && count <= 6)) return NextResponse.json({ error: "1–6 kaw" }, { status: 400 });
  if (!getGuest(guestId)) return NextResponse.json({ error: "Nie ma takiego gościa" }, { status: 404 });
  applyWeeklyChecks(guestId);
  const r = addStamps(guestId, count, s.id);
  const referral = applyReferralBonus(guestId, s.id);
  const g = getGuest(guestId)!;
  return NextResponse.json({ ...r, stamps: g.stamps, referral, guest: guestCard(g), by: s.name });
}
