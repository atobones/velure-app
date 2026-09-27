"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import Counter from "@/components/Counter";
import StampGrid from "@/components/StampGrid";

export type Me = { id: number; name: string; role: "owner" | "barista" };
export const isOwner = (p: { role: string }) => p.role === "owner";

// Polish feminine verb forms
const MASC_A = ["kuba", "barnaba", "kosma", "bonawentura", "jarema", "boryna", "sasza", "misza", "nikita", "ilia"];
export const fem = (name: string) => {
  const n = name.trim().split(/\s+/)[0].toLowerCase();
  return n.endsWith("a") && !MASC_A.includes(n);
};
export const roleLabel = (p: { name: string; role: string }) => (isOwner(p) ? (fem(p.name) ? "właścicielka" : "właściciel") : "barista");

function plForm(n: number) {
  const a = Math.abs(n) % 100,
    b = a % 10;
  if (n === 1) return 0;
  if (b >= 2 && b <= 4 && !(a >= 12 && a <= 14)) return 1;
  return 2;
}
export const pl = (n: number, forms: [string, string, string]) => forms[plForm(n)];
export const stampAcc = (n: number) => pl(n, ["pieczątkę", "pieczątki", "pieczątek"]);
export const stampNom = (n: number) => pl(n, ["pieczątka", "pieczątki", "pieczątek"]);
export const overflowLine = (stamps: number, n: number) => {
  const o = stamps + n - 9;
  return o > 0 ? `Karta pełna, ${o} ${stampNom(o)} na nowej karcie` : null;
};
export function nextRewardLine(c: number) {
  if (c >= 9) return "Darmowa kawa czeka";
  if (c < 3) return `Jeszcze ${3 - c} do darmowego dodatku do kawy`;
  if (c < 6) return `Jeszcze ${6 - c} do −50% na deser`;
  const n = 9 - c;
  return `Jeszcze ${n} ${pl(n, ["kawa", "kawy", "kaw"])} do darmowej`;
}
export const fmtCard = (d: string) => (d + "________").slice(0, 8).replace(/^(.{4})/, "$1 ");

export const nowWarsaw = () => {
  const d = new Date();
  return {
    date: d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", timeZone: "Europe/Warsaw" }),
    time: d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }),
    weekday: d.toLocaleDateString("pl-PL", { weekday: "long", timeZone: "Europe/Warsaw" }),
  };
};

export const post = (url: string, body: unknown, method = "POST") =>
  fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => ({ ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) }));

const TONES = {
  primary: "bg-gold text-ink border-transparent",
  secondary: "bg-transparent text-ink border-[var(--line-accent)]",
  dark: "bg-dark text-cream border-transparent",
  ghost: "bg-transparent text-gold-ink border-transparent",
};

export function Btn({
  children,
  variant = "primary",
  icon,
  iconRight,
  full,
  disabled,
  onClick,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  variant?: keyof typeof TONES;
  icon?: string;
  iconRight?: string;
  full?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-[1.5px] px-5 text-[17px] font-semibold leading-[1.3] transition-transform active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 ${TONES[variant]} ${full ? "w-full" : ""} ${className}`}
    >
      {icon && <Icon name={icon} size={20} />}
      <span className="min-w-0">{children}</span>
      {iconRight && <Icon name={iconRight} size={20} />}
    </button>
  );
}

const PILL = {
  neutral: ["var(--sand)", "var(--ink-2)"],
  gold: ["var(--gold-12)", "var(--gold-ink)"],
  rose: ["var(--sand-2)", "var(--ink)"],
  green: ["rgba(91,127,98,.14)", "var(--green)"],
  warn: ["rgba(190,146,76,.2)", "var(--gold-ink)"],
  red: ["rgba(176,112,95,.14)", "var(--terra)"],
  dark: ["var(--dark)", "var(--cream)"],
};

export function Pill({ tone = "neutral", icon, children, className = "" }: { tone?: keyof typeof PILL; icon?: string; children: React.ReactNode; className?: string }) {
  const [bg, fg] = PILL[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[14px] font-semibold leading-[1.2] ${className}`} style={{ background: bg, color: fg }}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </span>
  );
}

export function CountBadge({ n }: { n: number }) {
  return <span className="inline-block h-6 min-w-6 rounded-full bg-dark px-[7px] text-center text-[13px] font-semibold leading-6 text-cream tabular-nums">{n}</span>;
}

export const SEC = "text-[15px] leading-[1.45] text-ink-2";
export const OVERLINE = "text-[13px] font-semibold uppercase leading-[1.2] tracking-[0.14em] text-ink-2";

export function Numpad({ onKey, keyH = 72 }: { onKey: (k: string) => void; keyH?: number }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "<"];
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onKey(k)}
          style={{ height: keyH }}
          className={`grid place-items-center rounded-[14px] border border-[var(--line-strong)] text-ink tabular-nums active:scale-[.97] ${k === "C" || k === "<" ? "bg-sand text-[16px] font-semibold" : "bg-white text-[30px] font-medium"}`}
        >
          {k === "C" ? "Wyczyść" : k === "<" ? <Icon name="chevron-left" size={28} /> : k}
          {k === "<" && <span className="sr-only">Usuń cyfrę</span>}
        </button>
      ))}
    </div>
  );
}

export function CoffeeStepper({ value, set, size = 76, min = 1 }: { value: number; set: (f: (v: number) => number) => void; size?: number; min?: number }) {
  const b = (dis: boolean) =>
    `grid flex-none place-items-center rounded-[14px] border-[1.5px] border-[var(--line-strong)] bg-white text-ink ${dis ? "cursor-not-allowed opacity-40" : "active:scale-[.96]"}`;
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label="Mniej kaw" disabled={value <= min} onClick={() => set((v) => Math.max(min, v - 1))} className={b(value <= min)} style={{ width: size, height: size }}>
        <Icon name="minus" size={26} />
      </button>
      <span className="flex flex-col items-center gap-0.5" style={{ width: size * 0.85 }}>
        <span className="font-semibold leading-none tabular-nums" style={{ fontSize: Math.round(size * 0.42) }}>
          {value}
        </span>
        <span className="text-[13px] font-medium leading-none text-ink-2">{pl(value, ["kawa", "kawy", "kaw"])}</span>
      </span>
      <button type="button" aria-label="Więcej kaw" disabled={value >= 6} onClick={() => set((v) => Math.min(6, v + 1))} className={b(value >= 6)} style={{ width: size, height: size }}>
        <Icon name="plus" size={26} />
      </button>
    </div>
  );
}

export function StampCard({ stamps, className = "" }: { stamps: number; className?: string }) {
  return (
    <div className={`card flex flex-col gap-4 p-4 ${className}`} style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-baseline justify-between">
        <Counter value={stamps} size={34} />
        <span className={OVERLINE}>Pieczątki</span>
      </div>
      <StampGrid stamps={Math.min(stamps, 9)} size={50} />
      <p className="text-[16px] font-medium leading-[1.4]">{nextRewardLine(stamps)}</p>
    </div>
  );
}

export function Dialog({ onClose, children }: { onClose?: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[var(--scrim)] lg:items-center lg:justify-center" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full flex-col gap-3 overflow-y-auto rounded-t-[28px] bg-cream px-5 pt-5 lg:w-[560px] lg:rounded-[28px] lg:p-8"
        style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom))", boxShadow: "var(--shadow-sheet)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => done.current(), 2600);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div className="fixed inset-x-4 z-50 mx-auto flex max-w-[480px] items-center gap-3 rounded-2xl bg-dark px-4 py-3.5 text-[15px] font-medium text-cream shadow-lg" style={{ bottom: "calc(96px + env(safe-area-inset-bottom))" }}>
      <Icon name="check-circle" size={22} stroke="#9cc3a3" />
      {message}
    </div>
  );
}

export function PageHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex flex-none items-center gap-2 px-5 pb-3.5 pt-2 lg:px-10 lg:pt-7">
      {onBack && (
        <button onClick={onBack} aria-label="Wróć" className="-ml-4 grid h-14 w-14 place-items-center">
          <Icon name="chevron-left" size={28} />
        </button>
      )}
      <h1 className="flex-1 font-serif text-[32px] leading-[1.15] lg:text-[40px]">{title}</h1>
      {right}
    </div>
  );
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const on = () => setOnline(navigator.onLine);
    on();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  return online;
}
