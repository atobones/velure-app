import { NextResponse } from "next/server";
import { db, CAFE_ID } from "@/lib/db";
import { requireOwner } from "@/lib/staff-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireOwner();
  if (s instanceof NextResponse) return s;
  const people = db().prepare("SELECT id, name, role, must_set_pin AS needsPin FROM staff WHERE cafe_id = ? AND active = 1 ORDER BY role DESC, id").all(CAFE_ID);
  return NextResponse.json({ me: s.id, people });
}

export async function POST(req: Request) {
  const s = await requireOwner();
  if (s instanceof NextResponse) return s;
  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim().replace(/\s+/g, " ").slice(0, 30);
  const role = b.role === "owner" ? "owner" : "barista";
  if (name.length < 2) return NextResponse.json({ error: "Wpisz imię." }, { status: 400 });
  const d = db();
  if (d.prepare("SELECT 1 FROM staff WHERE cafe_id = ? AND active = 1 AND lower(name) = lower(?)").get(CAFE_ID, name))
    return NextResponse.json({ error: "Ta osoba już jest na liście." }, { status: 409 });
  d.prepare("INSERT INTO staff (cafe_id, name, role, pin_hash, must_set_pin) VALUES (?, ?, ?, '', 1)").run(CAFE_ID, name, role);
  return NextResponse.json({ ok: true });
}
