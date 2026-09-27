import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { getGuest, type Guest } from "./loyalty";

const GUEST_COOKIE = "vg";
const STAFF_COOKIE = "vs";
const YEAR = 60 * 60 * 24 * 365;

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

export async function startGuestSession(guestId: number) {
  const token = randomBytes(32).toString("hex");
  db().prepare("INSERT INTO guest_sessions (token, guest_id) VALUES (?, ?)").run(token, guestId);
  (await cookies()).set(GUEST_COOKIE, token, cookieOpts(YEAR));
}

export async function currentGuest(): Promise<Guest | undefined> {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!token) return undefined;
  const row = db().prepare("SELECT guest_id FROM guest_sessions WHERE token = ?").get(token) as { guest_id: number } | undefined;
  return row ? getGuest(row.guest_id) : undefined;
}

export async function endGuestSession() {
  const jar = await cookies();
  const token = jar.get(GUEST_COOKIE)?.value;
  if (token) db().prepare("DELETE FROM guest_sessions WHERE token = ?").run(token);
  jar.delete(GUEST_COOKIE);
}

export type Staff = { id: number; name: string; role: "owner" | "barista" };

export function verifyPin(pinHash: string, pin: string): boolean {
  const [salt, hash] = pinHash.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pin, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Lockout: 5 wrong → 1 min, 10 → 15 min, 15+ → 1 h
const failures = new Map<number, { n: number; until: number }>();

export function pinLocked(staffId: number): boolean {
  const f = failures.get(staffId);
  return !!f && f.until > Date.now();
}

export function recordPinFailure(staffId: number) {
  const f = failures.get(staffId) ?? { n: 0, until: 0 };
  f.n += 1;
  if (f.n % 5 === 0) f.until = Date.now() + (f.n >= 15 ? 3_600_000 : f.n >= 10 ? 900_000 : 60_000);
  failures.set(staffId, f);
}

export async function startStaffSession(staffId: number) {
  failures.delete(staffId);
  const token = randomBytes(32).toString("hex");
  db().prepare("INSERT INTO staff_sessions (token, staff_id) VALUES (?, ?)").run(token, staffId);
  (await cookies()).set(STAFF_COOKIE, token, cookieOpts(60 * 60 * 16));
}

export async function currentStaff(): Promise<Staff | undefined> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token) return undefined;
  return db()
    .prepare(
      `SELECT s.id, s.name, s.role FROM staff_sessions ss JOIN staff s ON s.id = ss.staff_id
       WHERE ss.token = ? AND s.active = 1 AND ss.created_at >= datetime('now', '-16 hours')`,
    )
    .get(token) as Staff | undefined;
}

export async function endStaffSession() {
  const jar = await cookies();
  const token = jar.get(STAFF_COOKIE)?.value;
  if (token) db().prepare("DELETE FROM staff_sessions WHERE token = ?").run(token);
  jar.delete(STAFF_COOKIE);
}
