import { NextResponse } from "next/server";
import { currentGuest } from "@/lib/auth";
import { createGift } from "@/lib/loyalty";

// Public host behind the proxy
function publicOrigin(req: Request) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

export async function POST(req: Request) {
  const g = await currentGuest();
  if (!g) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const token = createGift(g.id, Number(body.rewardId));
  if (!token) return NextResponse.json({ error: "Tej nagrody nie można podarować." }, { status: 400 });
  return NextResponse.json({ token, url: `${publicOrigin(req)}/prezent/${token}`, from: g.name.split(" ")[0] });
}
