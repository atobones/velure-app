"use client";
import Icon from "./Icon";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mt-2 mb-2">{children}</p>;
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[var(--scrim)]" onClick={onClose}>
      <div
        className="mx-auto flex max-h-[88dvh] w-full max-w-[480px] flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-white px-5 pt-5"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))", boxShadow: "var(--shadow-sheet)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-9 shrink-0 self-center rounded-full bg-[var(--line-strong)]" />
        {children}
      </div>
    </div>
  );
}

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-[28px] leading-[1.2]">{children}</h2>;
}

export function RewardStep(p: { n: number; title: string; desc?: string; icon: string; state: "earned" | "current" | "locked"; last?: boolean; actionLabel?: string; onAction?: () => void }) {
  const earned = p.state === "earned";
  const current = p.state === "current";
  return (
    <div className="flex items-stretch gap-4">
      <div className="flex w-11 flex-none flex-col items-center">
        <div
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-[14px] font-semibold"
          style={{
            background: earned ? "var(--gold)" : current ? "var(--gold-12)" : "var(--sand)",
            border: `1.5px solid ${current ? "var(--gold)" : "transparent"}`,
            color: earned ? "var(--ink)" : current ? "var(--gold-ink)" : "var(--ink-2)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {earned ? <Icon name="check" size={20} stroke="var(--ink)" /> : p.n}
        </div>
        {!p.last && <div className="mt-1 min-h-5 w-0.5 flex-1" style={{ background: earned ? "var(--line-accent)" : "var(--line)" }} />}
      </div>
      <div className={`min-w-0 flex-1 ${p.last ? "" : "pb-5"}`}>
        <div className="mb-0.5 flex items-center gap-2">
          <Icon name={p.icon} size={18} stroke={earned || current ? "var(--gold)" : "var(--ink-2)"} />
          <span className={`text-[17px] font-semibold leading-[1.3] ${p.state === "locked" ? "text-ink-2" : "text-ink"}`}>{p.title}</span>
        </div>
        {p.desc && <p className="text-[14px] leading-[1.45] text-ink-2">{p.desc}</p>}
        {p.actionLabel && (
          <button onClick={p.onAction} className="btn-line mt-3 px-4 text-[14px]">
            {p.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function CouponCard(p: { type: string; title: string; meta: string; icon: string; used?: boolean; actionLabel?: string; onAction?: () => void }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-4"
      style={{
        background: p.used ? "var(--sand)" : "#fff",
        border: `1px solid ${p.used ? "transparent" : "var(--line-accent)"}`,
        opacity: p.used ? 0.62 : 1,
      }}
    >
      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full" style={{ background: p.used ? "var(--line)" : "var(--gold-12)" }}>
        <Icon name={p.used ? "check" : p.icon} size={21} stroke={p.used ? "var(--ink-2)" : "var(--gold)"} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`mb-0.5 text-[13px] font-semibold uppercase tracking-[0.1em] ${p.used ? "text-ink-2" : "text-gold-ink"}`}>{p.type}</p>
        <p className={`text-[15px] font-semibold leading-[1.35] ${p.used ? "text-ink-2 line-through" : "text-ink"}`}>{p.title}</p>
        <p className="mt-0.5 text-[13px] leading-[1.35] text-ink-2">{p.meta}</p>
      </div>
      {!p.used && p.onAction && (
        <button onClick={p.onAction} className="min-h-11 flex-none rounded-xl bg-gold px-3.5 text-[14px] font-semibold text-ink">
          {p.actionLabel}
        </button>
      )}
    </div>
  );
}

export function ActionCard({ icon, title, body, onClick }: { icon: string; title: string; body: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="card flex w-full items-start gap-3 p-4 text-left">
      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[var(--gold-12)]">
        <Icon name={icon} size={21} stroke="var(--gold)" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-[1.35]">{title}</p>
        <p className="mt-0.5 text-[13px] leading-[1.45] text-ink-2">{body}</p>
      </div>
      <Icon name="chevron" size={18} stroke="var(--ink-2)" className="mt-3" />
    </button>
  );
}

export function NoticeCard({ icon, tone, title, body, children }: { icon: string; tone: "sand" | "rose" | "success" | "error"; title: string; body: string; children?: React.ReactNode }) {
  const bg = { sand: "var(--sand)", rose: "var(--sand-2)", success: "rgba(91,127,98,.14)", error: "rgba(176,112,95,.14)" }[tone];
  const ink = { sand: "var(--gold-ink)", rose: "var(--ink)", success: "var(--green)", error: "var(--clay)" }[tone];
  return (
    <div className="card flex items-start gap-3 p-4">
      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full" style={{ background: bg }}>
        <Icon name={icon} size={21} stroke={ink} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-[1.35]">{title}</p>
        <p className="mt-0.5 text-[13px] leading-[1.45] text-ink-2">{body}</p>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-7 w-12 flex-none rounded-full transition-colors"
      style={{ background: checked ? "var(--gold)" : "var(--line-strong)" }}
    >
      <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform" style={{ left: 2, transform: checked ? "translateX(20px)" : "none" }} />
    </button>
  );
}

export function LangSwitch({ value, onChange }: { value: "pl" | "en"; onChange: (v: "pl" | "en") => void }) {
  return (
    <div className="flex rounded-full bg-sand p-1">
      {(["pl", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`min-h-9 rounded-full px-4 text-[14px] font-semibold ${value === l ? "bg-white text-ink shadow-sm" : "text-ink-2"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
