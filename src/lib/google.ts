import { createRemoteJWKSet, jwtVerify } from "jose";
import { db, CAFE_ID } from "./db";
import { createGuest } from "./loyalty";
import { startGuestSession } from "./auth";
import { cookies } from "next/headers";

const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function signInWithGoogle(credential: string, consent: boolean, expectedNonce?: string): Promise<{ created: boolean } | { error: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return { error: "Logowanie Google jest wyłączone." };
  let payload;
  try {
    ({ payload } = await jwtVerify(credential, JWKS, { audience: clientId, issuer: ["https://accounts.google.com", "accounts.google.com"] }));
  } catch {
    return { error: "Nie udało się potwierdzić konta Google." };
  }
  if (expectedNonce !== undefined && (!expectedNonce || payload.nonce !== expectedNonce)) return { error: "Nie udało się potwierdzić konta Google." };
  const email = String(payload.email ?? "").toLowerCase();
  if (!email || payload.email_verified !== true) return { error: "Konto Google nie ma potwierdzonego e-maila." };
  const existing = db().prepare("SELECT id FROM guests WHERE cafe_id = ? AND email = ?").get(CAFE_ID, email) as { id: number } | undefined;
  if (existing) {
    await startGuestSession(existing.id);
    return { created: false };
  }
  const name = String(payload.given_name ?? payload.name ?? email.split("@")[0]).slice(0, 60);
  const jar = await cookies();
  const g = createGuest(name, email, consent, { provider: "google", lang: jar.get("lang")?.value, referral: jar.get("vg_ref")?.value ?? null });
  await startGuestSession(g.id);
  return { created: true };
}
