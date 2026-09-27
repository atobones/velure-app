import { NextResponse } from "next/server";
import { getGuest, redeemReward } from "@/lib/loyalty";
import { db } from "@/lib/db";
import { guestCard, requireStaff } from "@/lib/staff-api";

export async function POST(req: Request) {
  const s = await requireStaff();
  if (s instanceof NextResponse) return s;
  const body = await req.json().catch(() => ({}));
  const rewardId = Number(body.rewardId);
  const row = db().prepare("SELECT guest_id FROM rewards WHERE id = ?").get(rewardId) as { guest_id: number } | undefined;
  if (!row || !redeemReward(rewardId, s.id)) return NextResponse.json({ error: "Nagroda już wydana." }, { status: 409 });
  return NextResponse.json({ ok: true, guest: guestCard(getGuest(row.guest_id)!) });
}
