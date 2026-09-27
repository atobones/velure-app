"use client";
import { useState } from "react";

export default function ClaimButton({ token }: { token: string }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function claim() {
    setBusy(true);
    const r = await fetch(`/api/gift/${token}/claim`, { method: "POST" });
    setBusy(false);
    if (r.ok) window.location.href = "/karta?prezent=1";
    else setErr((await r.json()).error);
  }
  return (
    <>
      <button onClick={claim} disabled={busy} className="btn-gold mt-6 text-[18px]">{busy ? "Chwila…" : "Odbierz prezent"}</button>
      {err && <p className="mt-3 text-[15px] text-terra">{err}</p>}
    </>
  );
}
