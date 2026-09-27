import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const base = process.env.PUBLIC_URL ?? new URL(req.url).origin;
  const res = NextResponse.redirect(`${base}/witaj?polecenie=1`, 303);
  if (/^[A-Za-z0-9_-]{4,16}$/.test(code)) res.cookies.set("vg_ref", code, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  return res;
}
