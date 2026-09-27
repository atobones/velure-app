import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentGuest, endGuestSession } from "@/lib/auth";

export async function POST() {
  const g = await currentGuest();
  if (!g) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  db().prepare("DELETE FROM guests WHERE id = ?").run(g.id);
  await endGuestSession();
  return NextResponse.json({ ok: true });
}
