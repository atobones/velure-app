"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { Numpad, SEC, roleLabel } from "../ui";

type Person = { id: number; name: string; role: "owner" | "barista"; needsPin: number };

export default function KasaLogin() {
  const [people, setPeople] = useState<Person[]>([]);
  const [who, setWho] = useState<Person | null>(null);
  const [pin, setPin] = useState("");
  const [first, setFirst] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/staff/people", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setPeople(j.people));
  }, []);

  function pick(p: Person) {
    setWho(p);
    setPin("");
    setFirst("");
    setErr("");
  }

  async function submit(code: string) {
    if (!who) return;
    if (who.needsPin) {
      if (!first) {
        setFirst(code);
        setPin("");
        return;
      }
      if (code !== first) {
        setErr("PIN-y się różnią. Wpisz nowy PIN jeszcze raz.");
        setFirst("");
        setPin("");
        return;
      }
    }
    setBusy(true);
    const r = await fetch(who.needsPin ? "/api/staff/setpin" : "/api/staff/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ staffId: who.id, pin: code }),
    });
    setBusy(false);
    if (r.ok) {
      window.location.href = "/kasa";
      return;
    }
    const j = await r.json().catch(() => ({}));
    setErr(j.error ?? "Nie udało się zalogować.");
    setPin("");
    setFirst("");
  }

  function press(k: string) {
    if (!who || busy) return;
    setErr("");
    const next = k === "<" ? pin.slice(0, -1) : k === "C" ? "" : (pin + k).slice(0, 4);
    setPin(next);
    if (next.length === 4) submit(next);
  }

  const title = !who ? "" : who.needsPin ? (first ? `Powtórz PIN — ${who.name}` : `Ustaw PIN — ${who.name}`) : `PIN — ${who.name}`;

  return (
    <div className="staff-root grid min-h-dvh bg-cream lg:h-dvh lg:grid-cols-2">
      <div className={`flex flex-col justify-center gap-6 px-6 pb-8 pt-[calc(32px+env(safe-area-inset-top))] lg:px-16 lg:py-12 ${who ? "hidden lg:flex" : ""}`}>
        <div className="flex items-center gap-3.5">
          <img src="/img/brand/monogram.png" alt="" width={56} height={56} className="object-contain" />
          <span className="whitespace-nowrap text-[20px] font-semibold">Veluré Café</span>
        </div>
        <h1 className="font-serif text-[40px] leading-[1.1] lg:text-[48px]">Kto jest przy kasie?</h1>
        <div className="flex flex-col gap-2.5">
          {people.map((s) => {
            const on = who?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => pick(s)}
                className={`flex min-h-20 items-center gap-[18px] rounded-2xl bg-white px-[22px] text-left ${on ? "border-2 border-gold" : "border border-[var(--line-strong)]"}`}
              >
                <span className="h-[52px] w-[52px] flex-none rounded-full bg-dark text-center text-[22px] font-semibold leading-[52px] text-cream">{s.name[0]}</span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[21px] font-semibold leading-[1.25]">{s.name}</span>
                  <span className={`${SEC} text-[16px]`}>{s.needsPin ? `${roleLabel(s)} · pierwsze logowanie` : roleLabel(s)}</span>
                </span>
                {on && <Icon name="check-circle" size={28} stroke="var(--gold-ink)" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`flex-col justify-center gap-6 bg-sand px-6 pb-8 pt-[calc(24px+env(safe-area-inset-top))] lg:flex lg:px-24 lg:py-16 ${who ? "flex" : "hidden"}`}>
        {who ? (
          <>
            <button onClick={() => setWho(null)} className="-ml-2 flex items-center gap-1 self-start text-[16px] font-semibold text-gold-ink lg:hidden">
              <Icon name="chevron-left" size={22} /> Zmień osobę
            </button>
            <p className="text-center text-[22px] font-semibold leading-[1.3]">{title}</p>
            <div className="mb-3 flex justify-center gap-[22px]">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-[22px] w-[22px] rounded-full border-2 border-dark ${i < pin.length ? "bg-dark" : ""}`} />
              ))}
            </div>
            {err && <p className="-mt-2 text-center text-[16px] text-terra">{err}</p>}
            <Numpad onKey={press} keyH={80} />
            <p className={`${SEC} text-center`}>
              {who.needsPin
                ? "Wymyśl 4 cyfry, których nikt nie zgadnie. Potem wpiszesz je raz, na początku zmiany."
                : `PIN wpisujesz raz, na początku zmiany. Do „Zmień osobę” każda pieczątka i nagroda zapisze się jako ${who.name}`}
            </p>
          </>
        ) : (
          <p className={`${SEC} text-center text-[18px]`}>Wybierz swoje imię po lewej</p>
        )}
      </div>
    </div>
  );
}
