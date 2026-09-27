import { NextResponse } from "next/server";
import { signInWithGoogle } from "@/lib/google";

export async function GET() {
  return NextResponse.json({ clientId: process.env.GOOGLE_CLIENT_ID ?? null });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const r = await signInWithGoogle(String(body.credential ?? ""), !!body.consent);
  return "error" in r ? NextResponse.json(r, { status: 401 }) : NextResponse.json({ ok: true, ...r });
}
