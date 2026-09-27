import { NextResponse } from "next/server";
import { currentGuest } from "@/lib/auth";
import { openClaim } from "@/lib/claims";

export async function POST(req: Request) {
  const g = await currentGuest();
  if (!g) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return NextResponse.json({ error: "Dołącz zdjęcie paragonu." }, { status: 400 });
  const r = await openClaim(g.id, photo, String(form?.get("purchasedAt") ?? ""), String(form?.get("comment") ?? ""));
  return "error" in r ? NextResponse.json(r, { status: 400 }) : NextResponse.json({ ok: true, id: r.id });
}
