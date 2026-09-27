import { NextResponse } from "next/server";
import { endGuestSession } from "@/lib/auth";

export async function POST() {
  await endGuestSession();
  return NextResponse.json({ ok: true });
}
