import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pinLocked, recordPinFailure, startStaffSession, verifyPin } from "@/lib/auth";
import { allow, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.staffId);
  const pin = String(body.pin ?? "");
  const s = db().prepare("SELECT id, pin_hash, must_set_pin FROM staff WHERE id = ? AND active = 1").get(id) as { id: number; pin_hash: string; must_set_pin: number } | undefined;
  if (!s) return NextResponse.json({ error: "Nie ma takiej osoby." }, { status: 404 });
  if (s.must_set_pin) return NextResponse.json({ error: "Najpierw ustaw PIN.", needsPin: true }, { status: 409 });
  if (!allow(`pin:${clientIp(req)}`, 20, 60 * 60 * 1000)) return NextResponse.json({ error: "Za dużo prób. Spróbuj później." }, { status: 429 });
  if (pinLocked(id)) return NextResponse.json({ error: "Za dużo prób. Spróbuj za minutę." }, { status: 429 });
  if (!/^\d{4}$/.test(pin) || !verifyPin(s.pin_hash, pin)) {
    recordPinFailure(id);
    return NextResponse.json({ error: "Zły PIN." }, { status: 401 });
  }
  await startStaffSession(id);
  return NextResponse.json({ ok: true });
}
