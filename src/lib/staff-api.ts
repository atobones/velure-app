import { NextResponse } from "next/server";
import { currentStaff, type Staff } from "./auth";
import { applyWeeklyChecks, getGuest, availableRewards, ensureBirthdayReward, nextRewardLine, visitCount, rewardView, type Guest } from "./loyalty";
import { db } from "./db";

export async function requireStaff(): Promise<Staff | NextResponse> {
  const s = await currentStaff();
  return s ?? NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function requireOwner(): Promise<Staff | NextResponse> {
  const s = await currentStaff();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return s.role === "owner" ? s : NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export function guestCard(g0: Guest) {
  applyWeeklyChecks(g0.id);
  const g = getGuest(g0.id)!;
  ensureBirthdayReward(g);
  return {
    id: g.id,
    name: shortName(g.name),
    cardNumber: g.card_number,
    stamps: g.stamps,
    // Full card shows 9 / 9 until the free coffee is issued
    display: g.stamps === 0 && g.cycles > 0 && availableRewards(g.id).some((r) => r.type === "coffee9" && !r.gift_from) ? 9 : g.stamps,
    cycles: g.cycles,
    visits: visitCount(g.id),
    visit:
      visitCount(g.id) +
      (db().prepare("SELECT 1 FROM events WHERE guest_id = ? AND undone = 0 AND kind IN ('stamp','signup') AND date(created_at) = date('now')").get(g.id) ? 0 : 1),
    nextLine: nextRewardLine(g.stamps),
    birthdayThisWeek: availableRewards(g.id).some((r) => r.type === "birthday"),
    rewards: availableRewards(g.id).map(rewardView),
    stampedToday: !!db()
      .prepare("SELECT 1 FROM events WHERE guest_id = ? AND kind = 'stamp' AND undone = 0 AND date(created_at) = date('now')")
      .get(g.id),
  };
}

export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}
