import { NextResponse } from "next/server";
import { db, hashPin } from "@/lib/db";
import { startStaffSession } from "@/lib/auth";
import { allow, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  if (!allow(`pin:${clientIp(req)}`, 20, 60 * 60 * 1000)) return NextResponse.json({ error: "Za dużo prób. Spróbuj później." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const pin = String(b.pin ?? "");
  if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: "PIN to 4 cyfry." }, { status: 400 });
  const r = db().prepare("UPDATE staff SET pin_hash = ?, must_set_pin = 0 WHERE id = ? AND active = 1 AND must_set_pin = 1").run(hashPin(pin), Number(b.staffId));
  if (!r.changes) return NextResponse.json({ error: "PIN jest już ustawiony." }, { status: 409 });
  await startStaffSession(Number(b.staffId));
  return NextResponse.json({ ok: true });
}
