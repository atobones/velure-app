import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { db, CAFE_ID, DATA_DIR } from "./db";
import { MENU } from "./menu";

export const NEWS_DIR = path.join(DATA_DIR, "news");
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export type News = { id: number; title: string; from_menu: number; description: string | null; price: number | null; photo: string; ends_on: string; ended_at: string | null; created_at: string };
export type Combo = { id: number; items: string; price: number; days: string; hours: string | null; ends_on: string; ended_at: string | null; created_at: string };

export function todayWarsaw(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
}

export function menuPrice(name: string): number | null {
  for (const s of MENU) for (const g of s.groups) for (const i of g.items) if (i.name === name) return i.price;
  return null;
}

export function menuPhoto(names: string[]): string {
  for (const n of names) for (const s of MENU) for (const g of s.groups) for (const i of g.items) if (i.name === n && i.photo) return `/img/menu/${i.photo}-hero.webp`;
  return "/img/brand/seating.webp";
}

export function menuNames(): { name: string; price: number; section: string }[] {
  return MENU.flatMap((s) => s.groups.flatMap((g) => g.items.map((i) => ({ name: i.name, price: i.price, section: g.title ?? s.title }))));
}

export function status(row: { ends_on: string; ended_at: string | null }): "active" | "ended" {
  return row.ended_at || row.ends_on < todayWarsaw() ? "ended" : "active";
}

export async function saveNewsPhoto(file: File): Promise<string | { error: string }> {
  const ext = TYPES[file.type];
  if (!ext) return { error: "Zdjęcie musi być JPG, PNG albo WEBP." };
  if (file.size > MAX_BYTES) return { error: "Zdjęcie jest za duże (max 8 MB)." };
  fs.mkdirSync(NEWS_DIR, { recursive: true });
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(NEWS_DIR, name), Buffer.from(await file.arrayBuffer()));
  return name;
}

export function allNews(): News[] {
  return db().prepare("SELECT * FROM news WHERE cafe_id = ? ORDER BY id DESC").all(CAFE_ID) as News[];
}

export function allCombos(): Combo[] {
  return db().prepare("SELECT * FROM combos WHERE cafe_id = ? ORDER BY id DESC").all(CAFE_ID) as Combo[];
}

const DAY = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const DAY_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function comboWindow(days: string, hours: string | null, lang: "pl" | "en" = "pl"): string {
  const names = lang === "en" ? DAY_EN : DAY;
  const on = [...days].map((c, i) => (c === "1" ? i : -1)).filter((i) => i >= 0);
  let d: string;
  if (on.length === 7) d = lang === "en" ? "Every day" : "Codziennie";
  else {
    const contiguous = on.every((v, i) => i === 0 || v === on[i - 1] + 1);
    d = contiguous && on.length > 2 ? `${names[on[0]]}–${names[on[on.length - 1]]}` : on.map((i) => names[i]).join(", ");
  }
  return hours ? `${d} ${hours}` : d;
}

export function publicContent(lang: "pl" | "en") {
  const news = allNews()
    .filter((n) => status(n) === "active")
    .map((n) => ({ id: n.id, title: n.title, description: n.description, price: n.price, endsOn: n.ends_on, photo: `/api/news/${n.id}/photo` }));
  const combos = allCombos()
    .filter((c) => status(c) === "active")
    .map((c) => {
      const items = JSON.parse(c.items) as { name: string; price: number }[];
      return { id: c.id, title: items.map((i) => i.name).join(" + "), image: menuPhoto(items.map((i) => i.name)), oldPrice: items.reduce((a, b) => a + b.price, 0), price: c.price, window: comboWindow(c.days, c.hours, lang), endsOn: c.ends_on };
    });
  return { news, combos };
}
