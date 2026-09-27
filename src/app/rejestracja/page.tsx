"use client";
import Link from "next/link";
import { useState } from "react";
import CodeStep from "@/components/CodeStep";
import { useT } from "@/components/useT";
import GoogleButton from "@/components/GoogleButton";

export default function Rejestracja() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { t } = useT();
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send(): Promise<string | null> {
    const r = await fetch("/api/guest/code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "register", name, email, consent }) });
    const j = await r.json();
    return r.ok ? null : j.error ?? "Coś poszło nie tak.";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const error = await send();
    setBusy(false);
    if (error) return setErr(error);
    setSent(true);
  }

  return (
    <main className="px-5 pb-10 pt-[calc(24px+env(safe-area-inset-top))]">
      <button onClick={() => history.back()} className="text-[15px] font-semibold text-gold-ink">{t.back}</button>
      <h1 className="mt-4 font-serif text-[40px] leading-[1.12]">{t.signupTitle}</h1>
      {sent ? (
        <CodeStep email={email.trim().toLowerCase()} resend={send} onBack={() => setSent(false)} />
      ) : (
        <>
          <p className="mt-2 text-[16px] text-ink-2">{t.signupLead}</p>
          <GoogleButton consent={consent} />
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[14px] text-ink-2">{t.name}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" required className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3.5 text-[17px] outline-none focus:border-gold" />
            </label>
            <label className="block">
              <span className="text-[14px] text-ink-2">{t.email}</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" required className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3.5 text-[17px] outline-none focus:border-gold" />
            </label>
            <p className="text-[14px] text-ink-2">
              {t.accept1} <Link href="/regulamin" className="font-semibold text-gold-ink">{t.terms}</Link> {t.and}{" "}
              <Link href="/prywatnosc" className="font-semibold text-gold-ink">{t.privacy}</Link>.
            </p>
            <label className="flex items-start gap-3 border-t border-line pt-4">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--gold)]" />
              <span>
                <span className="block text-[16px]">{t.marketingLabel}</span>
                <span className="block text-[14px] text-ink-2">{t.marketingHint}</span>
              </span>
            </label>
            {err && <p className="rounded-xl bg-[var(--gold-12)] px-4 py-3 text-[15px] text-terra">{err}</p>}
            <button disabled={busy} className="btn-gold mt-2">{busy ? t.sending : t.sendCode}</button>
          </form>
        </>
      )}
    </main>
  );
}
