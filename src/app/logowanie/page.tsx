"use client";
import { useState } from "react";
import CodeStep from "@/components/CodeStep";
import { useT } from "@/components/useT";
import GoogleButton from "@/components/GoogleButton";

export default function Logowanie() {
  const [email, setEmail] = useState("");
  const { t } = useT();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send(): Promise<string | null> {
    const r = await fetch("/api/guest/code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "login", email }) });
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
      <h1 className="mt-4 font-serif text-[40px] leading-[1.12]">{t.loginTitle}</h1>
      {sent ? (
        <CodeStep email={email.trim().toLowerCase()} resend={send} onBack={() => setSent(false)} />
      ) : (
        <>
          <GoogleButton />
          <p className="mt-2 text-[16px] text-ink-2">{t.loginLead}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" required placeholder="e-mail" className="w-full rounded-xl border border-line bg-white px-4 py-3.5 text-[17px] outline-none focus:border-gold" />
            {err && <p className="rounded-xl bg-[var(--gold-12)] px-4 py-3 text-[15px] text-terra">{err}</p>}
            <button disabled={busy} className="btn-gold">{busy ? t.sending : t.sendCode}</button>
          </form>
        </>
      )}
    </main>
  );
}
