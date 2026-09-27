import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff, shortName } from "@/lib/staff-api";
import { REWARD_LABEL, type RewardType } from "@/lib/loyalty";
import { pieczatki } from "@/lib/pl";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireStaff();
  if (s instanceof NextResponse) return s;
  const d = db();
  const since = warsawMidnightUtc();
  const one = (sql: string) => (d.prepare(sql).get(since) as { n: number }).n;
  const rows = d
    .prepare(
      `SELECT e.id, e.kind, e.count, e.stamps_before, e.stamps_after, e.reward_type, e.created_at, g.name AS guest, st.name AS staff
       FROM events e JOIN guests g ON g.id = e.guest_id LEFT JOIN staff st ON st.id = e.staff_id
       WHERE e.undone = 0 AND e.created_at >= ? ORDER BY e.id DESC LIMIT 30`,
    )
    .all(since) as { id: number; kind: string; count: number; stamps_before: number; stamps_after: number; reward_type: RewardType | null; created_at: string; guest: string; staff: string | null }[];
  return NextResponse.json({
    me: s,
    stats: {
      scans: one("SELECT COUNT(*) AS n FROM events WHERE kind='stamp' AND undone=0 AND staff_id IS NOT NULL AND created_at >= ?"),
      newCards: one("SELECT COUNT(*) AS n FROM events WHERE kind='signup' AND created_at >= ?"),
      rewards: one("SELECT COUNT(*) AS n FROM events WHERE kind='redeem' AND created_at >= ?"),
    },
    rows: rows.map((r) => ({
      id: r.id,
      time: r.created_at,
      guest: shortName(r.guest),
      staff: r.staff,
      text:
        r.kind === "signup"
          ? "Nowa karta · 1 / 9"
          : r.kind === "redeem"
            ? `Wydano: ${REWARD_LABEL[r.reward_type!].title.toLowerCase()}`
            : `+${r.count} ${pieczatki(r.count)} · ${r.stamps_after === 0 ? 9 : r.stamps_after} / 9`,
      reward: r.kind === "redeem",
    })),
  });
}

function warsawMidnightUtc(): string {
  const now = new Date();
  const day = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  const wHour = Number(now.toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Warsaw" })) % 24;
  const offset = (wHour - now.getUTCHours() + 24) % 24; // 1 in winter, 2 in summer
  const start = new Date(`${day}T00:00:00Z`);
  start.setUTCHours(start.getUTCHours() - offset);
  return start.toISOString().slice(0, 19).replace("T", " ");
}
