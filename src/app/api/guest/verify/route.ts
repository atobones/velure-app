import { NextResponse } from "next/server";
import { db, CAFE_ID } from "@/lib/db";
import { verifyCode } from "@/lib/codes";
import { createGuest } from "@/lib/loyalty";
import { startGuestSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const r = verifyCode(email, String(body.code ?? ""));
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });

  const existing = db().prepare("SELECT id FROM guests WHERE cafe_id = ? AND email = ?").get(CAFE_ID, email) as { id: number } | undefined;
  if (existing) {
    await startGuestSession(existing.id);
    return NextResponse.json({ ok: true, created: false });
  }
  if (!r.name) return NextResponse.json({ error: "Nie znamy tego e-maila. Załóż kartę." }, { status: 404 });
  const jar = await cookies();
  const g = createGuest(r.name, email, r.consent, { provider: "email", lang: jar.get("lang")?.value, referral: jar.get("vg_ref")?.value ?? null });
  await startGuestSession(g.id);
  return NextResponse.json({ ok: true, created: true });
}
