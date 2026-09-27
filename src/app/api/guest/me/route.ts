import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { visibleClaim } from "@/lib/claims";
import { currentGuest } from "@/lib/auth";
import { applyWeeklyChecks, getGuest, weekStatus, pendingGifts, availableRewards, ensureBirthdayReward, history, nextRewardLine, visitCount, rewardView } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

export async function GET() {
  const g0 = await currentGuest();
  if (!g0) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  applyWeeklyChecks(g0.id);
  if (!g0.referral_code) db().prepare("UPDATE guests SET referral_code = ? WHERE id = ?").run(randomBytes(6).toString("base64url"), g0.id);
  const g = getGuest(g0.id)!;
  ensureBirthdayReward(g);
  const claim = visibleClaim(g.id);
  const used = db()
    .prepare("SELECT type, redeemed_at, gift_from FROM rewards WHERE guest_id = ? AND status = 'redeemed' ORDER BY redeemed_at DESC LIMIT 5")
    .all(g.id) as { type: string; redeemed_at: string; gift_from: string | null }[];
  const qr = await QRCode.toString(`VELURE:${g.qr_token}`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#2a211d", light: "#ffffff" } });
  return NextResponse.json({
    name: g.name,
    email: g.email,
    cardNumber: g.card_number,
    qr,
    stamps: g.stamps,
    cycles: g.cycles,
    nextLine: nextRewardLine(g.stamps),
    birthday: g.birthday,
    consent: !!g.marketing_consent,
    since: g.created_at,
    visits: visitCount(g.id),
    rewards: availableRewards(g.id).map(rewardView),
    history: history(g.id),
    gifts: pendingGifts(g.id),
    used,
    week: weekStatus(g.id),
    claim: claim ? { id: claim.id, status: claim.status, createdAt: claim.created_at } : null,
    provider: g.auth_provider ?? "email",
    lang: g.lang ?? "pl",
    notifications: !!g.notifications,
    referralCode: g.referral_code ?? null,
  });
}
