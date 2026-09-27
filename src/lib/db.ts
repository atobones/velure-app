import Database from "better-sqlite3";
import { randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.VELURE_DB ?? path.join(process.cwd(), "data", "velure.db");

type Glob = typeof globalThis & { __velureDb?: Database.Database };
const g = globalThis as Glob;

export function db(): Database.Database {
  if (g.__velureDb) return g.__velureDb;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const d = new Database(DB_PATH);
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  migrate(d);
  seed(d);
  g.__velureDb = d;
  return d;
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS cafes (
      id INTEGER PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY,
      cafe_id INTEGER NOT NULL REFERENCES cafes(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      card_number TEXT UNIQUE NOT NULL,
      qr_token TEXT UNIQUE NOT NULL,
      stamps INTEGER NOT NULL DEFAULT 0,
      cycles INTEGER NOT NULL DEFAULT 0,
      birthday TEXT,
      marketing_consent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (cafe_id, email)
    );
    CREATE TABLE IF NOT EXISTS guest_sessions (
      token TEXT PRIMARY KEY,
      guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY,
      cafe_id INTEGER NOT NULL REFERENCES cafes(id),
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner','barista')),
      pin_hash TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS staff_sessions (
      token TEXT PRIMARY KEY,
      staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY,
      guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
      staff_id INTEGER REFERENCES staff(id),
      kind TEXT NOT NULL CHECK (kind IN ('signup','stamp','redeem')),
      count INTEGER NOT NULL DEFAULT 0,
      stamps_before INTEGER,
      stamps_after INTEGER,
      cycles_before INTEGER,
      reward_type TEXT,
      created_reward_ids TEXT,
      undone INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY,
      guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('addon3','dessert6','coffee9','birthday')),
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','redeemed','void')),
      year INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      redeemed_at TEXT,
      redeemed_by INTEGER REFERENCES staff(id)
    );
    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      reward_id INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
      from_guest INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
      to_guest INTEGER REFERENCES guests(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      claimed_at TEXT,
      cancelled_at TEXT
    );
    CREATE TABLE IF NOT EXISTS login_codes (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      name TEXT,
      consent INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY,
      guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
      photo TEXT NOT NULL,
      purchased_at TEXT NOT NULL,
      comment TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','added','rejected')),
      seen INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      resolved_by INTEGER REFERENCES staff(id)
    );
    CREATE TABLE IF NOT EXISTS week_checks (
      guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
      window_start TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('saved','reset')),
      check_month TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (guest_id, window_start)
    );
    CREATE INDEX IF NOT EXISTS idx_login_codes_email ON login_codes(email, id);
    CREATE INDEX IF NOT EXISTS idx_events_guest ON events(guest_id, id);
    CREATE INDEX IF NOT EXISTS idx_rewards_guest ON rewards(guest_id, status);
  `);
  const cols = d.prepare("PRAGMA table_info(rewards)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "gift_from")) d.exec("ALTER TABLE rewards ADD COLUMN gift_from TEXT");
  const gcols = d.prepare("PRAGMA table_info(guests)").all() as { name: string }[];
  const addGuestCol = (name: string, ddl: string) => {
    if (!gcols.some((c) => c.name === name)) d.exec(`ALTER TABLE guests ADD COLUMN ${ddl}`);
  };
  addGuestCol("birthday_set_at", "birthday_set_at TEXT");
  addGuestCol("auth_provider", "auth_provider TEXT NOT NULL DEFAULT 'email'");
  addGuestCol("lang", "lang TEXT NOT NULL DEFAULT 'pl'");
  addGuestCol("notifications", "notifications INTEGER NOT NULL DEFAULT 1");
  addGuestCol("referral_code", "referral_code TEXT");
  addGuestCol("referred_by", "referred_by INTEGER");
  addGuestCol("referral_done", "referral_done INTEGER NOT NULL DEFAULT 0");
  d.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_referral ON guests(referral_code)");
  const scols = d.prepare("PRAGMA table_info(staff)").all() as { name: string }[];
  if (!scols.some((c) => c.name === "must_set_pin")) d.exec("ALTER TABLE staff ADD COLUMN must_set_pin INTEGER NOT NULL DEFAULT 0");
  d.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY,
      cafe_id INTEGER NOT NULL REFERENCES cafes(id),
      title TEXT NOT NULL,
      from_menu INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      price INTEGER,
      photo TEXT NOT NULL,
      ends_on TEXT NOT NULL,
      ended_at TEXT,
      created_by INTEGER REFERENCES staff(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS combos (
      id INTEGER PRIMARY KEY,
      cafe_id INTEGER NOT NULL REFERENCES cafes(id),
      items TEXT NOT NULL,
      price INTEGER NOT NULL,
      days TEXT NOT NULL DEFAULT '1111111',
      hours TEXT,
      ends_on TEXT NOT NULL,
      ended_at TEXT,
      created_by INTEGER REFERENCES staff(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
}

function seed(d: Database.Database) {
  const cafe = d.prepare("SELECT id FROM cafes WHERE slug = 'velure'").get();
  if (cafe) return;
  // STAFF_SEED="Name:owner:1234;Name:barista:5678"
  const raw = process.env.STAFF_SEED ?? (process.env.NODE_ENV === "production" ? "" : "Owner:owner:1111;Barista:barista:2222");
  const people = raw
    .split(";")
    .map((x) => x.split(":").map((v) => v.trim()))
    .filter(([name, role, pin]) => name && (role === "owner" || role === "barista") && /^\d{4}$/.test(pin ?? ""));
  if (!people.some(([, role]) => role === "owner")) throw new Error("STAFF_SEED must include at least one owner");
  const cafeId = d.prepare("INSERT INTO cafes (slug, name) VALUES ('velure', 'Veluré Café')").run().lastInsertRowid;
  const ins = d.prepare("INSERT INTO staff (cafe_id, name, role, pin_hash) VALUES (?, ?, ?, ?)");
  for (const [name, role, pin] of people) ins.run(cafeId, name, role, hashPin(pin));
}

export const CAFE_ID = 1;

export const DATA_DIR = path.dirname(DB_PATH);
