import { NextResponse } from "next/server";
import { db, CAFE_ID } from "@/lib/db";
import { requireOwner } from "@/lib/staff-api";
import { allNews, saveNewsPhoto, status, todayWarsaw } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireOwner();
  if (s instanceof NextResponse) return s;
  return NextResponse.json({ news: allNews().map((n) => ({ ...n, status: status(n), photo: `/api/news/${n.id}/photo` })) });
}

export async function POST(req: Request) {
  const s = await requireOwner();
  if (s instanceof NextResponse) return s;
  const f = await req.formData().catch(() => null);
  if (!f) return NextResponse.json({ error: "Brak danych." }, { status: 400 });
  const photo = f.get("photo");
  const title = String(f.get("title") ?? "").trim().slice(0, 60);
  const endsOn = String(f.get("endsOn") ?? "");
  const priceRaw = String(f.get("price") ?? "").trim();
  const price = priceRaw ? Math.round(Number(priceRaw)) : null;
  if (!(photo instanceof File) || photo.size === 0) return NextResponse.json({ error: "Dodaj zdjęcie." }, { status: 400 });
  if (title.length < 2) return NextResponse.json({ error: "Wpisz nazwę." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endsOn) || endsOn < todayWarsaw()) return NextResponse.json({ error: "Bez daty końca nie opublikujesz." }, { status: 400 });
  if (price !== null && !(price > 0 && price < 1000)) return NextResponse.json({ error: "Sprawdź cenę." }, { status: 400 });
  const saved = await saveNewsPhoto(photo);
  if (typeof saved !== "string") return NextResponse.json(saved, { status: 400 });
  db()
    .prepare("INSERT INTO news (cafe_id, title, from_menu, description, price, photo, ends_on, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(CAFE_ID, title, f.get("fromMenu") === "1" ? 1 : 0, String(f.get("description") ?? "").trim().slice(0, 140) || null, price, saved, endsOn, s.id);
  return NextResponse.json({ ok: true });
}
