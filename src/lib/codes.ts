import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "./db";

const TTL_MIN = 10;
const MAX_ATTEMPTS = 5;

const hash = (email: string, code: string) => createHash("sha256").update(`${email}:${code}:${process.env.CODE_PEPPER ?? "velure"}`).digest("hex");

export function rateLimited(email: string): string | null {
  const d = db();
  const lastMin = d.prepare("SELECT COUNT(*) n FROM login_codes WHERE email = ? AND created_at >= datetime('now','-60 seconds')").get(email) as { n: number };
  if (lastMin.n > 0) return "Kod już wysłany. Nowy możesz poprosić za minutę.";
  const lastHour = d.prepare("SELECT COUNT(*) n FROM login_codes WHERE email = ? AND created_at >= datetime('now','-1 hour')").get(email) as { n: number };
  if (lastHour.n >= 5) return "Za dużo prób. Spróbuj za godzinę.";
  return null;
}

export function issueCode(email: string, name: string | null, consent: boolean): string {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  db().prepare("INSERT INTO login_codes (email, code_hash, name, consent) VALUES (?, ?, ?, ?)").run(email, hash(email, code), name, consent ? 1 : 0);
  return code;
}

export type Verified = { name: string | null; consent: boolean };

export function verifyCode(email: string, code: string): Verified | { error: string } {
  const d = db();
  const row = d
    .prepare(
      `SELECT id, code_hash, name, consent, attempts FROM login_codes
       WHERE email = ? AND used = 0 AND created_at >= datetime('now', ?) ORDER BY id DESC LIMIT 1`,
    )
    .get(email, `-${TTL_MIN} minutes`) as { id: number; code_hash: string; name: string | null; consent: number; attempts: number } | undefined;
  if (!row) return { error: "Kod wygasł. Poproś o nowy." };
  if (row.attempts >= MAX_ATTEMPTS) return { error: "Za dużo błędnych prób. Poproś o nowy kod." };
  const a = Buffer.from(row.code_hash, "hex");
  const b = Buffer.from(hash(email, code.trim()), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    d.prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE id = ?").run(row.id);
    return { error: "Zły kod. Sprawdź e-mail i spróbuj jeszcze raz." };
  }
  d.prepare("UPDATE login_codes SET used = 1 WHERE id = ?").run(row.id);
  return { name: row.name, consent: !!row.consent };
}
