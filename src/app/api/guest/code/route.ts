import { NextResponse } from "next/server";
import { db, CAFE_ID } from "@/lib/db";
import { issueCode, rateLimited } from "@/lib/codes";
import { sendLoginCode } from "@/lib/mail";
import { allow, clientIp } from "@/lib/ratelimit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mode = body.mode === "login" ? "login" : "register";
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 120);
  const name = String(body.name ?? "").trim().slice(0, 60);
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Podaj poprawny e-mail." }, { status: 400 });
  if (mode === "register" && !name) return NextResponse.json({ error: "Podaj imię." }, { status: 400 });

  const exists = !!db().prepare("SELECT 1 FROM guests WHERE cafe_id = ? AND email = ?").get(CAFE_ID, email);
  if (mode === "register" && exists) return NextResponse.json({ error: "Ten e-mail ma już kartę. Wybierz „Mam już konto”.", code: "exists" }, { status: 409 });
  if (mode === "login" && !exists) return NextResponse.json({ error: "Nie znamy tego e-maila. Załóż kartę.", code: "unknown" }, { status: 404 });

  // Limit per IP
  if (!allow(`code:${clientIp(req)}`, 8, 60 * 60 * 1000)) return NextResponse.json({ error: "Za dużo prób z tego urządzenia. Spróbuj za godzinę." }, { status: 429 });
  const limited = rateLimited(email);
  if (limited) return NextResponse.json({ error: limited }, { status: 429 });

  const code = issueCode(email, mode === "register" ? name : null, !!body.consent);
  try {
    await sendLoginCode(email, code);
  } catch (e) {
    console.error("mail send failed", e);
    return NextResponse.json({ error: "Nie udało się wysłać e-maila. Spróbuj za chwilę." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
