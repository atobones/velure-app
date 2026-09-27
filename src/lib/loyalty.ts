import { randomBytes, randomInt } from "node:crypto";
import { db, CAFE_ID } from "./db";

export const CARD_SIZE = 9;
export const THRESHOLDS: { at: number; type: RewardType }[] = [
  { at: 3, type: "addon3" },
  { at: 6, type: "dessert6" },
  { at: 9, type: "coffee9" },
];

export type RewardType = "addon3" | "dessert6" | "coffee9" | "birthday";

export const REWARD_LABEL: Record<RewardType, { title: string; sub: string }> = {
  addon3: { title: "Dodatek do kawy gratis", sub: "Mleko roślinne, syrop albo dodatkowe espresso" },
  dessert6: { title: "−50% na deser", sub: "Nagroda za 6 pieczątek" },
  coffee9: { title: "Dowolna kawa gratis", sub: "Karta pełna · bez matchy" },
  birthday: { title: "Deser gratis w tygodniu urodzin", sub: "Raz w roku kalendarzowym" },
};

export type Guest = {
  auth_provider?: string;
  lang?: string;
  notifications?: number;
  referral_code?: string | null;
  referred_by?: number | null;
  referral_done?: number;
  id: number;
  name: string;
  email: string;
  card_number: string;
  qr_token: string;
  stamps: number;
  cycles: number;
  birthday: string | null;
  birthday_set_at?: string | null;
  marketing_consent: number;
  created_at: string;
};

export type Reward = { id: number; type: RewardType; status: string; created_at: string; gift_from: string | null };

export function nextRewardLine(stamps: number): string {
  if (stamps < 3) return `Jeszcze ${3 - stamps} do dodatku do kawy gratis`;
  if (stamps < 6) return `Jeszcze ${6 - stamps} do −50% na deser`;
  if (stamps < 9) return `Jeszcze ${9 - stamps} do kawy gratis`;
  return "Darmowa kawa czeka";
}

function uniqueCardNumber(): string {
  const d = db();
  for (;;) {
    const n = String(randomInt(10_000_000, 99_999_999));
    if (!d.prepare("SELECT 1 FROM guests WHERE card_number = ?").get(n)) return n;
  }
}

export type SignupOpts = { provider?: "email" | "google"; lang?: string; referral?: string | null };

export function createGuest(name: string, email: string, consent: boolean, opts: SignupOpts = {}): Guest {
  const d = db();
  const tx = d.transaction(() => {
    const referrer = opts.referral
      ? (d.prepare("SELECT id FROM guests WHERE referral_code = ?").get(opts.referral) as { id: number } | undefined)
      : undefined;
    const id = d
      .prepare(
        `INSERT INTO guests (cafe_id, name, email, card_number, qr_token, stamps, marketing_consent, auth_provider, lang, referral_code, referred_by)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
      )
      .run(
        CAFE_ID, name, email, uniqueCardNumber(), randomBytes(16).toString("hex"), consent ? 1 : 0,
        opts.provider ?? "email", opts.lang === "en" ? "en" : "pl", randomBytes(6).toString("base64url"), referrer?.id ?? null,
      )
      .lastInsertRowid as number;
    d.prepare(
      "INSERT INTO events (guest_id, kind, count, stamps_before, stamps_after, cycles_before) VALUES (?, 'signup', 1, 0, 1, 0)",
    ).run(id);
    return id;
  });
  return getGuest(tx())!;
}

export function getGuest(id: number): Guest | undefined {
  return db().prepare("SELECT * FROM guests WHERE id = ?").get(id) as Guest | undefined;
}

export function findGuestByCode(code: string): Guest | undefined {
  const raw = code.trim();
  const token = raw.startsWith("VELURE:") ? raw.slice(7) : null;
  const d = db();
  if (token) return d.prepare("SELECT * FROM guests WHERE qr_token = ?").get(token) as Guest | undefined;
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8) return undefined;
  return d.prepare("SELECT * FROM guests WHERE card_number = ?").get(digits) as Guest | undefined;
}

// Birthday reward: ±3 days, once a year, date saved 30+ days before
export function ensureBirthdayReward(g: Guest & { birthday_set_at?: string | null }) {
  const d = db();
  d.prepare("UPDATE rewards SET status = 'void' WHERE guest_id = ? AND type = 'birthday' AND status = 'available' AND created_at < datetime('now','-7 days')").run(g.id);
  if (!g.birthday) return;
  const setAt = g.birthday_set_at ? new Date(g.birthday_set_at.replace(" ", "T") + "Z") : null;
  if (!setAt || Date.now() - setAt.getTime() < 30 * 86_400_000) return;
  const [dd, mm] = g.birthday.split(".").map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const hit = [-1, 0, 1].some((dy) => Math.abs(new Date(now.getFullYear() + dy, mm - 1, dd).getTime() - today) <= 3 * 86_400_000);
  if (!hit) return;
  const year = now.getFullYear();
  if (d.prepare("SELECT 1 FROM rewards WHERE guest_id = ? AND type = 'birthday' AND year = ?").get(g.id, year)) return;
  d.prepare("INSERT INTO rewards (guest_id, type, year) VALUES (?, 'birthday', ?)").run(g.id, year);
}

export function rewardView(r: Reward) {
  const label = REWARD_LABEL[r.type];
  return { id: r.id, type: r.type, title: label.title, sub: r.gift_from ? `Prezent od ${shortGiftName(r.gift_from)}` : label.sub, giftFrom: r.gift_from ? shortGiftName(r.gift_from) : null, giftable: GIFTABLE.includes(r.type) && !r.gift_from };
}

function shortGiftName(full: string) {
  const p = full.trim().split(/\s+/);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0];
}

export function availableRewards(guestId: number): Reward[] {
  return db()
    .prepare(
      `SELECT id, type, status, created_at, gift_from FROM rewards
       WHERE guest_id = ? AND status = 'available'
         AND id NOT IN (SELECT reward_id FROM gifts WHERE claimed_at IS NULL AND cancelled_at IS NULL AND created_at >= datetime('now','-30 days'))
       ORDER BY id`,
    )
    .all(guestId) as Reward[];
}

export function addStamps(guestId: number, count: number, staffId: number | null) {
  const d = db();
  return d.transaction(() => {
    const g = getGuest(guestId);
    if (!g) throw new Error("guest not found");
    let stamps = g.stamps;
    let cycles = g.cycles;
    const created: number[] = [];
    const insReward = d.prepare("INSERT INTO rewards (guest_id, type) VALUES (?, ?)");
    for (let i = 0; i < count; i++) {
      stamps += 1;
      const hit = THRESHOLDS.find((t) => t.at === stamps);
      if (hit) created.push(insReward.run(guestId, hit.type).lastInsertRowid as number);
      if (stamps === CARD_SIZE) {
        stamps = 0;
        cycles += 1;
      }
    }
    d.prepare("UPDATE guests SET stamps = ?, cycles = ? WHERE id = ?").run(stamps, cycles, guestId);
    const eventId = d
      .prepare(
        `INSERT INTO events (guest_id, staff_id, kind, count, stamps_before, stamps_after, cycles_before, created_reward_ids)
         VALUES (?, ?, 'stamp', ?, ?, ?, ?, ?)`,
      )
      .run(guestId, staffId, count, g.stamps, stamps, g.cycles, JSON.stringify(created)).lastInsertRowid as number;
    return { eventId, stamps, cycles, fullCards: cycles - g.cycles, newRewards: created.length };
  })();
}

export const UNDO_SECONDS = 60;

export function undoStamp(eventId: number): boolean {
  const d = db();
  return d.transaction(() => {
    const e = d
      .prepare(
        `SELECT * FROM events WHERE id = ? AND kind = 'stamp' AND undone = 0
         AND created_at >= datetime('now', ?)`,
      )
      .get(eventId, `-${UNDO_SECONDS} seconds`) as
      | { guest_id: number; stamps_before: number; cycles_before: number; created_reward_ids: string }
      | undefined;
    if (!e) return false;
    // Only the latest event can be undone
    const latest = d.prepare("SELECT id FROM events WHERE guest_id = ? AND undone = 0 ORDER BY id DESC LIMIT 1").get(e.guest_id) as { id: number };
    if (latest.id !== eventId) return false;
    const ids: number[] = JSON.parse(e.created_reward_ids || "[]");
    for (const id of ids) {
      const moved = d.prepare("SELECT 1 FROM rewards WHERE id = ? AND guest_id != ?").get(id, e.guest_id);
      const gifting = d.prepare("SELECT 1 FROM gifts WHERE reward_id = ? AND cancelled_at IS NULL").get(id);
      if (moved || gifting) return false;
    }
    for (const id of ids) {
      const r = d.prepare("SELECT status FROM rewards WHERE id = ?").get(id) as { status: string } | undefined;
      if (r && r.status === "redeemed") return false;
    }
    for (const id of ids) d.prepare("UPDATE rewards SET status = 'void' WHERE id = ?").run(id);
    d.prepare("UPDATE guests SET stamps = ?, cycles = ? WHERE id = ?").run(e.stamps_before, e.cycles_before, e.guest_id);
    d.prepare("UPDATE events SET undone = 1 WHERE id = ?").run(eventId);
    return true;
  })();
}

export function redeemReward(rewardId: number, staffId: number): boolean {
  const d = db();
  return d.transaction(() => {
    const pending = d.prepare("SELECT 1 FROM gifts WHERE reward_id = ? AND claimed_at IS NULL AND cancelled_at IS NULL AND created_at >= datetime('now','-30 days')").get(rewardId);
    if (pending) return false;
    const r = d.prepare("SELECT * FROM rewards WHERE id = ? AND status = 'available'").get(rewardId) as
      | { guest_id: number; type: RewardType }
      | undefined;
    if (!r) return false;
    d.prepare("UPDATE rewards SET status = 'redeemed', redeemed_at = datetime('now'), redeemed_by = ? WHERE id = ?").run(
      staffId,
      rewardId,
    );
    d.prepare("INSERT INTO events (guest_id, staff_id, kind, reward_type) VALUES (?, ?, 'redeem', ?)").run(
      r.guest_id,
      staffId,
      r.type,
    );
    return true;
  })();
}

export type HistoryRow = { id: number; kind: string; count: number; stamps_after: number | null; reward_type: RewardType | null; created_at: string; staff_name: string | null };

export function history(guestId: number, limit = 50): HistoryRow[] {
  return db()
    .prepare(
      `SELECT e.id, e.kind, e.count, e.stamps_after, e.reward_type, e.created_at, s.name AS staff_name
       FROM events e LEFT JOIN staff s ON s.id = e.staff_id
       WHERE e.guest_id = ? AND e.undone = 0 ORDER BY e.id DESC LIMIT ?`,
    )
    .all(guestId, limit) as HistoryRow[];
}

export function visitCount(guestId: number): number {
  const r = db()
    .prepare("SELECT COUNT(DISTINCT date(created_at)) AS n FROM events WHERE guest_id = ? AND undone = 0 AND kind IN ('stamp','signup')")
    .get(guestId) as { n: number };
  return r.n;
}

export function pendingGifts(guestId: number) {
  return db()
    .prepare(
      `SELECT g.id, g.token, g.created_at, r.type FROM gifts g JOIN rewards r ON r.id = g.reward_id
       WHERE g.from_guest = ? AND g.claimed_at IS NULL AND g.cancelled_at IS NULL
         AND g.created_at >= datetime('now', '-30 days')`,
    )
    .all(guestId) as { id: number; token: string; created_at: string; type: RewardType }[];
}

export const GIFTABLE: RewardType[] = ["coffee9"];

export function createGift(guestId: number, rewardId: number): string | null {
  const d = db();
  const r = d.prepare("SELECT type FROM rewards WHERE id = ? AND guest_id = ? AND status = 'available' AND gift_from IS NULL").get(rewardId, guestId) as { type: RewardType } | undefined;
  if (!r || !GIFTABLE.includes(r.type)) return null;
  const open = d.prepare("SELECT token FROM gifts WHERE reward_id = ? AND claimed_at IS NULL AND cancelled_at IS NULL AND created_at >= datetime('now','-30 days')").get(rewardId) as { token: string } | undefined;
  if (open) return open.token;
  const token = randomBytes(12).toString("base64url");
  d.prepare("INSERT INTO gifts (token, reward_id, from_guest) VALUES (?, ?, ?)").run(token, rewardId, guestId);
  return token;
}

export function cancelGift(guestId: number, giftId: number): boolean {
  return db().prepare("UPDATE gifts SET cancelled_at = datetime('now') WHERE id = ? AND from_guest = ? AND claimed_at IS NULL AND cancelled_at IS NULL").run(giftId, guestId).changes > 0;
}

export type GiftInfo = { id: number; rewardId: number; fromGuest: number; fromName: string; type: RewardType; state: "open" | "claimed" | "cancelled" | "expired" };

export function giftByToken(token: string): GiftInfo | undefined {
  const g = db()
    .prepare(
      `SELECT g.id, g.reward_id, g.from_guest, g.claimed_at, g.cancelled_at, g.created_at >= datetime('now','-30 days') AS fresh,
              s.name AS from_name, r.type
       FROM gifts g JOIN guests s ON s.id = g.from_guest JOIN rewards r ON r.id = g.reward_id WHERE g.token = ?`,
    )
    .get(token) as { id: number; reward_id: number; from_guest: number; claimed_at: string | null; cancelled_at: string | null; fresh: number; from_name: string; type: RewardType } | undefined;
  if (!g) return undefined;
  const state = g.claimed_at ? "claimed" : g.cancelled_at ? "cancelled" : !g.fresh ? "expired" : "open";
  return { id: g.id, rewardId: g.reward_id, fromGuest: g.from_guest, fromName: g.from_name.split(" ")[0], type: g.type, state };
}

export function claimGift(token: string, toGuest: number): { ok: true } | { ok: false; error: string } {
  const d = db();
  return d.transaction(() => {
    const g = giftByToken(token);
    if (!g || g.state !== "open") return { ok: false as const, error: "Ten prezent jest już nieaktualny." };
    if (g.fromGuest === toGuest) return { ok: false as const, error: "Nie możesz odebrać własnego prezentu. Wyślij link znajomemu." };
    const r = d.prepare("SELECT status FROM rewards WHERE id = ?").get(g.rewardId) as { status: string } | undefined;
    if (!r || r.status !== "available") return { ok: false as const, error: "Ten prezent jest już nieaktualny." };
    const from = getGuest(g.fromGuest)!;
    d.prepare("UPDATE rewards SET guest_id = ?, gift_from = ? WHERE id = ?").run(toGuest, from.name, g.rewardId);
    d.prepare("UPDATE gifts SET to_guest = ?, claimed_at = datetime('now') WHERE id = ?").run(toGuest, g.id);
    return { ok: true as const };
  })();
}

export function applyReferralBonus(guestId: number, staffId: number) {
  const d = db();
  const g = getGuest(guestId);
  if (!g || !g.referred_by || g.referral_done) return false;
  const paid = d.prepare("SELECT COUNT(*) n FROM events WHERE guest_id = ? AND kind = 'stamp' AND undone = 0").get(guestId) as { n: number };
  if (paid.n !== 1) return false;
  d.prepare("UPDATE guests SET referral_done = 1 WHERE id = ?").run(guestId);
  addStamps(guestId, 1, staffId);
  if (getGuest(g.referred_by)) addStamps(g.referred_by, 1, staffId);
  return true;
}

// Weekly reset: Tue–Mon windows, one save per month

const TZ = "Europe/Warsaw";
const DAY = 86_400_000;

function warsawDay(d: Date): number {
  const [y, m, dd] = d.toLocaleDateString("en-CA", { timeZone: TZ }).split("-").map(Number);
  return Date.UTC(y, m - 1, dd);
}

const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

function windowStart(t: number): number {
  const dow = new Date(t).getUTCDay(); // 0 Sun … 2 Tue
  return t - ((dow - 2 + 7) % 7) * DAY;
}

function lastActivityDay(guestId: number): number | null {
  const r = db()
    .prepare("SELECT MAX(created_at) AS t FROM events WHERE guest_id = ? AND undone = 0 AND kind IN ('stamp','signup')")
    .get(guestId) as { t: string | null };
  return r.t ? warsawDay(new Date(r.t.replace(" ", "T") + "Z")) : null;
}

export function applyWeeklyChecks(guestId: number) {
  const d = db();
  const g = getGuest(guestId);
  if (!g || g.stamps === 0) return;
  const last = lastActivityDay(guestId);
  if (last === null) return;
  const today = warsawDay(new Date());
  for (let w = windowStart(last) + 7 * DAY; w + 7 * DAY <= today; w += 7 * DAY) {
    const key = iso(w);
    if (d.prepare("SELECT 1 FROM week_checks WHERE guest_id = ? AND window_start = ?").get(guestId, key)) continue;
    const checkMonth = iso(w + 7 * DAY).slice(0, 7);
    const savedThisMonth = d.prepare("SELECT 1 FROM week_checks WHERE guest_id = ? AND action = 'saved' AND check_month = ?").get(guestId, checkMonth);
    if (!savedThisMonth) {
      d.prepare("INSERT INTO week_checks (guest_id, window_start, action, check_month) VALUES (?, ?, 'saved', ?)").run(guestId, key, checkMonth);
      continue;
    }
    d.transaction(() => {
      d.prepare("INSERT INTO week_checks (guest_id, window_start, action, check_month) VALUES (?, ?, 'reset', ?)").run(guestId, key, checkMonth);
      d.prepare("UPDATE guests SET stamps = 0 WHERE id = ?").run(guestId);
    })();
    return;
  }
}

export function weekStatus(guestId: number) {
  const d = db();
  const today = warsawDay(new Date());
  const month = iso(today).slice(0, 7);
  const savedThisMonth = !!d.prepare("SELECT 1 FROM week_checks WHERE guest_id = ? AND action = 'saved' AND check_month = ?").get(guestId, month);
  const resetRecently = !!d
    .prepare("SELECT 1 FROM week_checks WHERE guest_id = ? AND action = 'reset' AND created_at >= datetime('now','-7 days')")
    .get(guestId);
  const g = getGuest(guestId);
  const last = lastActivityDay(guestId);
  const isMonday = new Date(today).getUTCDay() === 1;
  const noStampThisWindow = last === null || last < windowStart(today);
  return { savedThisMonth, resetRecently, mondayWarning: isMonday && !!g && g.stamps > 0 && noStampThisWindow };
}
