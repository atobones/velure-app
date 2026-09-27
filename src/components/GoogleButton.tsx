"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "./useT";

type GoogleId = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; ux_mode: "redirect"; login_uri: string; nonce: string }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};

export default function GoogleButton({ consent = false }: { consent?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const { t, lang } = useT();

  const nonce = useRef("");
  if (!nonce.current && typeof crypto !== "undefined") nonce.current = crypto.randomUUID();
  useEffect(() => {
    const gift = new URLSearchParams(location.search).get("prezent");
    document.cookie = `vg_pending=${encodeURIComponent(JSON.stringify({ consent, gift, nonce: nonce.current }))}; path=/; max-age=900; samesite=none; secure`;
  }, [consent]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("blad") === "google") setErr("Nie udało się zalogować przez Google. Spróbuj ponownie albo użyj e-maila.");
  }, []);

  useEffect(() => {
    fetch("/api/guest/google").then((r) => r.json()).then((j) => setClientId(j.clientId));
  }, []);

  useEffect(() => {
    if (!clientId || !box.current) return;
    const init = () => {
      const g = (window as unknown as { google?: GoogleId }).google;
      if (!g || !box.current) return;
      g.accounts.id.initialize({ client_id: clientId, ux_mode: "redirect", login_uri: `${location.origin}/api/guest/google/callback`, nonce: nonce.current });
      g.accounts.id.renderButton(box.current, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "rectangular", locale: lang, width: Math.min(box.current.offsetWidth || 340, 400) });
    };
    if ((window as unknown as { google?: GoogleId }).google) return init();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = init;
    document.head.appendChild(s);
  }, [clientId, lang]);

  if (!clientId) return null;
  return (
    <div className="mt-6">
      <div ref={box} className="flex min-h-[44px] w-full justify-center" />
      {err && <p className="mt-2 text-center text-[14px] text-terra">{err}</p>}
      <div className="my-5 flex items-center gap-3 text-[13px] text-ink-2">
        <span className="h-px flex-1 bg-[var(--line-strong)]" /> {t.orEmail} <span className="h-px flex-1 bg-[var(--line-strong)]" />
      </div>
    </div>
  );
}
