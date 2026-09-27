import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentGuest } from "@/lib/auth";

export async function POST(req: Request) {
  const g = await currentGuest();
  if (!g) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (g.birthday) return NextResponse.json({ error: "Datę można podać tylko raz. Zmiana przez kontakt z nami." }, { status: 409 });
  const body = await req.json().catch(() => ({}));
  const m = String(body.date ?? "").match(/^(\d{1,2})\.(\d{1,2})$/);
  const dd = m ? Number(m[1]) : 0;
  const mm = m ? Number(m[2]) : 0;
  const valid = m && mm >= 1 && mm <= 12 && dd >= 1 && dd <= new Date(2024, mm, 0).getDate();
  if (!valid) return NextResponse.json({ error: "Wpisz datę jako dd.mm, np. 14.03" }, { status: 400 });
  const date = `${String(dd).padStart(2, "0")}.${String(mm).padStart(2, "0")}`;
  db().prepare("UPDATE guests SET birthday = ?, birthday_set_at = datetime('now') WHERE id = ?").run(date, g.id);
  return NextResponse.json({ ok: true, date });
}
