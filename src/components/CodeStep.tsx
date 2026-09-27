"use client";
import { useState } from "react";
import { useT } from "./useT";

export default function CodeStep({ email, resend, onBack }: { email: string; resend: () => Promise<string | null>; onBack: () => void }) {
  const [code, setCode] = useState("");
  const { t } = useT();
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function verify(value: string) {
    setBusy(true);
    setErr("");
    const r = await fetch("/api/guest/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, code: value }) });
    const j = await r.json();
    if (!r.ok) {
      setBusy(false);
      setCode("");
      return setErr(j.error);
    }
    const gift = new URLSearchParams(location.search).get("prezent");
    if (gift) {
      const c = await fetch(`/api/gift/${gift}/claim`, { method: "POST" });
      window.location.href = c.ok ? "/karta?prezent=1" : `/prezent/${gift}`;
      return;
    }
    window.location.href = j.created ? "/pierwsza-pieczatka" : "/start";
  }

  return (
    <div className="mt-6">
      <p className="text-[16px] text-ink-2">
        {t.codeSent} <b className="text-ink">{email}</b>. {t.checkSpam}
      </p>
      <input
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
          setCode(v);
          if (v.length === 6) verify(v);
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        placeholder="••••••"
        className="mt-4 w-full rounded-xl border border-line bg-white px-4 py-4 text-center font-mono text-[30px] tracking-[0.4em] outline-none focus:border-gold"
      />
      {err && <p className="mt-3 rounded-xl bg-[var(--gold-12)] px-4 py-3 text-[15px] text-terra">{err}</p>}
      {info && <p className="mt-3 text-[14px] text-ink-2">{info}</p>}
      <button disabled={busy || code.length !== 6} onClick={() => verify(code)} className="btn-gold mt-4">
        {busy ? t.checking : t.confirm}
      </button>
      <div className="mt-4 flex justify-between text-[15px] font-semibold text-gold-ink">
        <button onClick={onBack}>{t.changeEmail}</button>
        <button
          onClick={async () => {
            setErr("");
            const e = await resend();
            setInfo(e ?? t.resent);
          }}
        >
          {t.resend}
        </button>
      </div>
    </div>
  );
}
