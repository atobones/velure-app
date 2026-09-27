import { NextResponse } from "next/server";
import { currentGuest } from "@/lib/auth";
import { cancelGift } from "@/lib/loyalty";

export async function POST(req: Request) {
  const g = await currentGuest();
  if (!g) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  return cancelGift(g.id, Number(body.giftId)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Prezent został już odebrany." }, { status: 409 });
}
