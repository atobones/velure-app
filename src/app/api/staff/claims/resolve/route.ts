import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addStamps } from "@/lib/loyalty";
import { requireStaff } from "@/lib/staff-api";

export async function POST(req: Request) {
  const s = await requireStaff();
  if (s instanceof NextResponse) return s;
  if (s.role !== "owner") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const d = db();
  const c = d.prepare("SELECT id, guest_id FROM claims WHERE id = ? AND status = 'pending'").get(Number(b.id)) as { id: number; guest_id: number } | undefined;
  if (!c) return NextResponse.json({ error: "Zgłoszenie już rozpatrzone." }, { status: 409 });
  d.transaction(() => {
    if (b.action === "add") addStamps(c.guest_id, 1, s.id);
    d.prepare("UPDATE claims SET status = ?, resolved_at = datetime('now'), resolved_by = ? WHERE id = ?").run(b.action === "add" ? "added" : "rejected", s.id, c.id);
  })();
  return NextResponse.json({ ok: true });
}
