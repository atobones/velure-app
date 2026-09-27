import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signInWithGoogle } from "@/lib/google";
import { claimGift } from "@/lib/loyalty";
import { currentGuest } from "@/lib/auth";

function origin(req: Request) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return host ? `${req.headers.get("x-forwarded-proto") ?? "https"}://${host}` : new URL(req.url).origin;
}

export async function POST(req: Request) {
  const base = origin(req);
  const form = await req.formData();
  const jar = await cookies();
  // Some mobile browsers drop the g_csrf_token cookie
  const csrf = String(form.get("g_csrf_token") ?? "");
  const csrfCookie = jar.get("g_csrf_token")?.value;
  if (csrfCookie && csrf !== csrfCookie) return NextResponse.redirect(`${base}/logowanie?blad=google`, 303);

  let pending: { consent?: boolean; gift?: string; nonce?: string } = {};
  try {
    pending = JSON.parse(decodeURIComponent(jar.get("vg_pending")?.value ?? "{}"));
  } catch {}
  jar.delete("vg_pending");

  const r = await signInWithGoogle(String(form.get("credential") ?? ""), !!pending.consent, pending.nonce ?? "");
  if ("error" in r) return NextResponse.redirect(`${base}/logowanie?blad=google`, 303);

  if (pending.gift) {
    const me = await currentGuest();
    const c = me ? claimGift(pending.gift, me.id) : { ok: false };
    return NextResponse.redirect(`${base}${c.ok ? "/karta?prezent=1" : `/prezent/${pending.gift}`}`, 303);
  }
  return NextResponse.redirect(`${base}${r.created ? "/pierwsza-pieczatka" : "/start"}`, 303);
}
