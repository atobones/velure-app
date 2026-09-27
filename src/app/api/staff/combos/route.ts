import { NextResponse } from "next/server";
import { db, CAFE_ID } from "@/lib/db";
import { requireOwner } from "@/lib/staff-api";
import { allCombos, comboWindow, menuPrice, status, todayWarsaw } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireOwner();
  if (s instanceof NextResponse) return s;
  return NextResponse.json({
    combos: allCombos().map((c) => {
      const items = JSON.parse(c.items) as { name: string; price: number }[];
      return { ...c, items, status: status(c), window: comboWindow(c.days, c.hours) };
    }),
  });
}

export async function POST(req: Request) {
  const s = await requireOwner();
  if (s instanceof NextResponse) return s;
  const b = await req.json().catch(() => ({}));
  const names: string[] = Array.isArray(b.items) ? b.items.map(String).slice(0, 6) : [];
  const items = names.map((name) => ({ name, price: menuPrice(name) }));
  if (items.length < 2 || items.some((i) => i.price === null)) return NextResponse.json({ error: "Wybierz co najmniej dwie pozycje z menu." }, { status: 400 });
  const sum = items.reduce((a, i) => a + (i.price ?? 0), 0);
  const price = Math.round(Number(b.price));
  if (!(price > 0 && price < sum)) return NextResponse.json({ error: "Cena zestawu musi być niższa niż osobno." }, { status: 400 });
  const days = /^[01]{7}$/.test(String(b.days)) && String(b.days).includes("1") ? String(b.days) : "1111111";
  const hours = /^\d{1,2}:\d{2}–\d{1,2}:\d{2}$/.test(String(b.hours ?? "")) ? String(b.hours) : null;
  const endsOn = String(b.endsOn ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endsOn) || endsOn < todayWarsaw()) return NextResponse.json({ error: "Wybierz datę końca." }, { status: 400 });
  db()
    .prepare("INSERT INTO combos (cafe_id, items, price, days, hours, ends_on, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(CAFE_ID, JSON.stringify(items), price, days, hours, endsOn, s.id);
  return NextResponse.json({ ok: true });
}
