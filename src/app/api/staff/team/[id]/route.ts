import { NextResponse } from "next/server";
import { db, CAFE_ID, hashPin } from "@/lib/db";
import { requireOwner } from "@/lib/staff-api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const s = await requireOwner();
  if (s instanceof NextResponse) return s;
  const id = Number((await params).id);
  const b = await req.json().catch(() => ({}));
  const pin = String(b.pin ?? "");
  if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: "PIN to 4 cyfry." }, { status: 400 });
  const d = db();
  const r = d.prepare("UPDATE staff SET pin_hash = ?, must_set_pin = 0 WHERE id = ? AND cafe_id = ? AND active = 1").run(hashPin(pin), id, CAFE_ID);
  if (!r.changes) return NextResponse.json({ error: "Nie ma takiej osoby." }, { status: 404 });
  if (id !== s.id) d.prepare("DELETE FROM staff_sessions WHERE staff_id = ?").run(id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const s = await requireOwner();
  if (s instanceof NextResponse) return s;
  const id = Number((await params).id);
  if (id === s.id) return NextResponse.json({ error: "Nie możesz usunąć siebie." }, { status: 400 });
  const d = db();
  const r = d.transaction(() => {
    const res = d.prepare("UPDATE staff SET active = 0 WHERE id = ? AND cafe_id = ? AND active = 1").run(id, CAFE_ID);
    d.prepare("DELETE FROM staff_sessions WHERE staff_id = ?").run(id);
    return res.changes;
  })();
  return r ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Nie ma takiej osoby." }, { status: 404 });
}
