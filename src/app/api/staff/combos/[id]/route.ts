import { NextResponse } from "next/server";
import { db, CAFE_ID } from "@/lib/db";
import { requireOwner } from "@/lib/staff-api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireOwner();
  if (s instanceof NextResponse) return s;
  db().prepare("UPDATE combos SET ended_at = datetime('now') WHERE id = ? AND cafe_id = ? AND ended_at IS NULL").run(Number((await params).id), CAFE_ID);
  return NextResponse.json({ ok: true });
}
