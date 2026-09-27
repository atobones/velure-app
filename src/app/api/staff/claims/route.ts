import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff, shortName } from "@/lib/staff-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireStaff();
  if (s instanceof NextResponse) return s;
  if (s.role !== "owner") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const rows = db()
    .prepare(
      `SELECT c.id, c.purchased_at, c.comment, c.created_at, c.guest_id, g.name, g.card_number, g.stamps,
              (SELECT COUNT(*) FROM claims c2 WHERE c2.guest_id = c.guest_id AND c2.created_at >= datetime('now','start of month')) AS month_count
       FROM claims c JOIN guests g ON g.id = c.guest_id WHERE c.status = 'pending' ORDER BY c.id`,
    )
    .all() as { id: number; purchased_at: string; comment: string | null; created_at: string; guest_id: number; name: string; card_number: string; stamps: number; month_count: number }[];
  return NextResponse.json({ claims: rows.map((r) => ({ ...r, name: shortName(r.name) })) });
}
