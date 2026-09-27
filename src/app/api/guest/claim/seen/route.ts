import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentGuest } from "@/lib/auth";

export async function POST() {
  const g = await currentGuest();
  if (!g) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  db().prepare("UPDATE claims SET seen = 1 WHERE guest_id = ? AND status != 'pending'").run(g.id);
  return NextResponse.json({ ok: true });
}
