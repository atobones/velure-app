"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { CountBadge, isOwner, roleLabel, useOnline, type Me } from "./ui";

export type Tab = "kasa" | "zgl" | "tresci" | "ust";

const NAV: { id: Tab; label: string; icon: string; href: string }[] = [
  { id: "kasa", label: "Kasa", icon: "qr-code", href: "/kasa" },
  { id: "zgl", label: "Zgłoszenia", icon: "message-circle", href: "/kasa/zgloszenia" },
  { id: "tresci", label: "Treści", icon: "sparkles", href: "/kasa/tresci" },
  { id: "ust", label: "Ustawienia", icon: "settings", href: "/kasa/ustawienia" },
];

export async function switchPerson() {
  await fetch("/api/staff/logout", { method: "POST" });
  window.location.href = "/kasa/login";
}

export function useClaimCount(me: Me) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!isOwner(me)) return;
    const load = () =>
      fetch("/api/staff/claims", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j && setN(j.claims.length))
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    window.addEventListener("velure:claims", load);
    return () => {
      clearInterval(t);
      window.removeEventListener("velure:claims", load);
    };
  }, [me]);
  return n;
}

export default function StaffShell({ me, active, tabs = true, children }: { me: Me; active: Tab; tabs?: boolean; children: React.ReactNode }) {
  const owner = isOwner(me);
  const count = useClaimCount(me);
  const online = useOnline();
  const items = owner ? NAV : NAV.filter((n) => n.id === "kasa");

  return (
    <div className="staff-root flex min-h-dvh bg-cream lg:h-dvh">
      <nav className="hidden w-[112px] flex-none flex-col gap-1.5 border-r border-line bg-sand px-2.5 py-4 lg:flex" style={{ width: owner ? 112 : 96 }}>
        <img src="/img/brand/monogram.png" alt="Veluré" width={44} height={44} className="mb-3.5 self-center object-contain" />
        {items.map((n) => {
          const on = n.id === active;
          return (
            <Link
              key={n.id}
              href={n.href}
              className={`relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-[14px] text-[13px] leading-[1.2] ${on ? "bg-white font-semibold text-ink" : "font-medium text-ink-2"}`}
              style={on ? { boxShadow: "var(--shadow-card)" } : undefined}
            >
              <Icon name={n.icon} size={26} stroke={on ? "var(--gold-ink)" : "currentColor"} />
              {n.label}
              {n.id === "zgl" && count > 0 && (
                <span className="absolute right-3.5 top-2">
                  <CountBadge n={count} />
                </span>
              )}
            </Link>
          );
        })}
        <div className="flex-1" />
        <button onClick={switchPerson} className="flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-[14px] border border-[var(--line-strong)] bg-white p-1.5">
          <span className="h-9 w-9 rounded-full bg-dark text-center text-[16px] font-semibold leading-9 text-cream">{me.name[0]}</span>
          <span className="text-[14px] font-semibold leading-[1.2]">{me.name}</span>
          <span className="text-[12px] leading-[1.2] text-ink-2">{roleLabel(me)}</span>
          <span className="text-[12px] font-medium leading-[1.2] text-gold-ink">Zmień osobę</span>
        </button>
      </nav>

      <main className={`relative flex min-w-0 flex-1 flex-col lg:overflow-y-auto ${tabs ? "pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-0" : ""}`} style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {!online && (
          <div className="flex flex-none items-center gap-3 bg-dark px-5 py-3 text-[15px] font-medium leading-[1.3] text-cream lg:px-7 lg:text-[16px]">
            <Icon name="cloud-off" size={22} />
            <span className="flex-1">Brak sieci. Pieczątki dodasz, gdy wróci internet</span>
          </div>
        )}
        {children}
      </main>

      {tabs && (
        <div className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-cream lg:hidden" style={{ gridTemplateColumns: `repeat(${owner ? 4 : 2},1fr)`, paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          {items.map((n) => {
            const on = n.id === active;
            return (
              <Link key={n.id} href={n.href} className={`relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[12px] leading-[1.2] ${on ? "font-semibold text-ink" : "font-medium text-ink-2"}`}>
                <Icon name={n.icon} size={24} stroke={on ? "var(--gold-ink)" : "currentColor"} />
                {n.label}
                {n.id === "zgl" && count > 0 && (
                  <span className="absolute left-[56%] top-1">
                    <CountBadge n={count} />
                  </span>
                )}
              </Link>
            );
          })}
          {!owner && (
            <button onClick={switchPerson} className="flex min-h-[60px] flex-col items-center justify-center gap-1 text-[12px] font-medium leading-[1.2] text-ink-2">
              <span className="h-[26px] w-[26px] rounded-full bg-dark text-center text-[13px] font-semibold leading-[26px] text-cream">{me.name[0]}</span>
              {me.name} · zmień
            </button>
          )}
        </div>
      )}
    </div>
  );
}
