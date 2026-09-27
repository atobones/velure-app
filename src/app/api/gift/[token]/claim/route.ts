import { NextResponse } from "next/server";
import { currentGuest } from "@/lib/auth";
import { claimGift } from "@/lib/loyalty";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const g = await currentGuest();
  if (!g) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = claimGift((await params).token, g.id);
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 409 });
}
