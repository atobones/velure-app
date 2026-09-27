import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentGuest } from "@/lib/auth";

export async function POST(req: Request) {
  const g = await currentGuest();
  if (!g) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const d = db();
  if (b.lang === "pl" || b.lang === "en") {
    d.prepare("UPDATE guests SET lang = ? WHERE id = ?").run(b.lang, g.id);
    (await cookies()).set("lang", b.lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  if (typeof b.notifications === "boolean") d.prepare("UPDATE guests SET notifications = ? WHERE id = ?").run(b.notifications ? 1 : 0, g.id);
  if (typeof b.consent === "boolean") d.prepare("UPDATE guests SET marketing_consent = ? WHERE id = ?").run(b.consent ? 1 : 0, g.id);
  return NextResponse.json({ ok: true });
}
