import { NextResponse } from "next/server";
import { db, CAFE_ID } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const people = db()
    .prepare("SELECT id, name, role, must_set_pin AS needsPin FROM staff WHERE cafe_id = ? AND active = 1 ORDER BY role DESC, id")
    .all(CAFE_ID);
  return NextResponse.json({ people });
}
