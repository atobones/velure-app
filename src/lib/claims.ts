import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { db, DATA_DIR } from "./db";

export const CLAIMS_DIR = path.join(DATA_DIR, "claims");
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" };

export type Claim = { id: number; guest_id: number; photo: string; purchased_at: string; comment: string | null; status: "pending" | "added" | "rejected"; seen: number; created_at: string; resolved_at: string | null };

export async function openClaim(guestId: number, file: File, purchasedAt: string, comment: string): Promise<{ id: number } | { error: string; code?: string }> {
  const ext = TYPES[file.type];
  if (!ext) return { error: "Wyślij zdjęcie (JPG, PNG albo HEIC)." };
  if (file.size > MAX_BYTES) return { error: "Zdjęcie jest za duże (max 8 MB)." };
  const d = db();
  const month = d.prepare("SELECT COUNT(*) n FROM claims WHERE guest_id = ? AND created_at >= datetime('now','start of month')").get(guestId) as { n: number };
  if (month.n >= 2) return { error: "W tym miesiącu wysłano już dwa zgłoszenia. Napisz do nas bezpośrednio: 575 602 489.", code: "limit" };
  if (d.prepare("SELECT 1 FROM claims WHERE guest_id = ? AND status = 'pending'").get(guestId)) return { error: "Poprzednie zgłoszenie jest jeszcze w trakcie." };
  fs.mkdirSync(CLAIMS_DIR, { recursive: true });
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(CLAIMS_DIR, name), Buffer.from(await file.arrayBuffer()));
  const id = d
    .prepare("INSERT INTO claims (guest_id, photo, purchased_at, comment) VALUES (?, ?, ?, ?)")
    .run(guestId, name, purchasedAt.slice(0, 40), comment.slice(0, 300) || null).lastInsertRowid as number;
  return { id };
}

export function visibleClaim(guestId: number): Claim | undefined {
  return db()
    .prepare("SELECT * FROM claims WHERE guest_id = ? AND (status = 'pending' OR seen = 0) ORDER BY id DESC LIMIT 1")
    .get(guestId) as Claim | undefined;
}
