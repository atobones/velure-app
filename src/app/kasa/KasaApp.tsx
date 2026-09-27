"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import Counter from "@/components/Counter";
import StaffShell, { switchPerson } from "./StaffShell";
import { Btn, CoffeeStepper, Dialog, Numpad, OVERLINE, Pill, SEC, StampCard, fem, fmtCard, isOwner, nextRewardLine, nowWarsaw, overflowLine, post, roleLabel, stampAcc, stampNom, type Me } from "./ui";

type Reward = { id: number; type: string; title: string; sub: string; giftFrom: string | null };
type Card = { id: number; name: string; cardNumber: string; stamps: number; display: number; cycles: number; visit: number; birthdayThisWeek: boolean; rewards: Reward[] };
type Row = { id: number; time: string; guest: string; staff: string | null; text: string; reward: boolean };
type Today = { stats: { scans: number; newCards: number; rewards: number }; rows: Row[] };
type Done = { eventId: number; n: number; before: number; stamps: number; fullCards: number; guest: Card; by: string; at: string };

const TILL: Record<string, { title: string; sub?: string; icon: string; main?: boolean }> = {
  addon3: { title: "Dodatek do kawy gratis", sub: "Mleko roślinne, syrop albo espresso", icon: "cup-soda" },
  dessert6: { title: "−50% na deser", sub: "Nagroda za 6 pieczątek", icon: "percent" },
  coffee9: { title: "Dowolna kawa gratis (bez matchy)", sub: "Karta pełna · 9 / 9", icon: "coffee", main: true },
  birthday: { title: "Deser gratis w tygodniu urodzin", sub: "Raz w roku", icon: "gift" },
};
const till = (r: Reward) => {
  const t = TILL[r.type] ?? { title: r.title, icon: "gift" };
  return { ...t, sub: r.giftFrom ? `Prezent od ${r.giftFrom}` : (t.sub ?? r.sub) };
};

function useWide() {
  const [wide, setWide] = useState<boolean | null>(null);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

export default function KasaApp({ me }: { me: Me }) {
  const wide = useWide();
  const [screen, setScreen] = useState<"wait" | "guest" | "done" | "unknown">("wait");
  const [card, setCard] = useState<Card | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [issued, setIssued] = useState<Record<number, string>>({});
  const [coffees, setCoffees] = useState(1);
  const [dlg, setDlg] = useState<Reward | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [digits, setDigits] = useState("");
  const [unknown, setUnknown] = useState("");
  const [keypad, setKeypad] = useState(false);
  const [camera, setCamera] = useState(false);
  const [today, setToday] = useState<Today | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const loadToday = useCallback(() => {
    fetch("/api/staff/today", { cache: "no-store" })
      .then((r) => (r.status === 401 ? (window.location.href = "/kasa/login", null) : r.ok ? r.json() : null))
      .then((j) => j && setToday(j))
      .catch(() => {});
  }, []);
  useEffect(() => {
    loadToday();
    const t = setInterval(loadToday, 30_000);
    return () => clearInterval(t);
  }, [loadToday]);

  const openCard = useCallback((g: Card) => {
    setCard(g);
    setRewards(g.rewards);
    setIssued({});
    setCoffees(1);
    setErr("");
    setScreen("guest");
  }, []);

  const lookup = useCallback(
    async (code: string) => {
      setErr("");
      const { ok, status, j } = await post("/api/staff/lookup", { code }).catch(() => ({ ok: false, status: 0, j: {} as Record<string, string> }));
      setKeypad(false);
      setCamera(false);
      setDigits("");
      if (status === 404) {
        setUnknown(code.replace(/\D/g, "").slice(0, 8) || code);
        setScreen("unknown");
        return;
      }
      if (!ok) return setErr(status === 0 ? "Brak sieci. Spróbuj za chwilę." : (j.error ?? "Coś poszło nie tak."));
      navigator.vibrate?.(40);
      openCard(j.guest);
    },
    [openCard],
  );

  // Hardware scanner types like a keyboard
  useEffect(() => {
    if (screen !== "wait") return;
    let buf = "";
    let last = 0;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const now = Date.now();
      if (now - last > 80) buf = "";
      last = now;
      if (e.key === "Enter") {
        if (buf.length >= 8) lookup(buf);
        buf = "";
      } else if (e.key.length === 1) buf += e.key;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, lookup]);

  async function issue(r: Reward) {
    const { ok, j } = await post("/api/staff/redeem", { rewardId: r.id });
    setDlg(null);
    if (!ok) return setErr(j.error ?? "Nie udało się wydać nagrody.");
    setIssued((s) => ({ ...s, [r.id]: nowWarsaw().time }));
    // Free coffee earns no stamp
    if (r.type === "coffee9") setCoffees((c) => Math.max(0, c - 1));
    loadToday();
  }

  async function addStamps() {
    if (!card || coffees < 1 || busy) return;
    setBusy(true);
    const { ok, j } = await post("/api/staff/stamp", { guestId: card.id, count: coffees }).catch(() => ({ ok: false, j: { error: "Brak sieci. Spróbuj za chwilę." } as Record<string, string> }));
    setBusy(false);
    if (!ok) return setErr(j.error ?? "Nie udało się dodać pieczątek.");
    setDone({ eventId: j.eventId, n: coffees, before: card.display, stamps: j.stamps, fullCards: j.fullCards, guest: card, by: j.by, at: nowWarsaw().time });
    setScreen("done");
    loadToday();
  }

  async function undo() {
    if (!done) return;
    const { ok, j } = await post("/api/staff/undo", { eventId: done.eventId });
    if (!ok) return setErr(j.error ?? "Nie można już cofnąć.");
    loadToday();
    const again = await post("/api/staff/lookup", { code: done.guest.cardNumber });
    setDone(null);
    if (again.ok) {
      setCard(again.j.guest);
      setScreen("guest");
    } else setScreen("wait");
  }

  const next = useCallback(() => {
    setDone(null);
    setCard(null);
    setErr("");
    setScreen("wait");
  }, []);

  if (wide === null) return <StaffShell me={me} active="kasa"><div /></StaffShell>;

  const Stepper = (size: number) => (
    <div className="flex flex-col items-center gap-1">
      <CoffeeStepper value={coffees} set={setCoffees} size={size} min={rewards.some((r) => r.type === "coffee9" && issued[r.id]) ? 0 : 1} />
      {rewards.some((r) => r.type === "coffee9" && issued[r.id]) && <span className="whitespace-nowrap text-[12px] font-medium leading-[1.3] text-ink-2 lg:text-[14px]">Kawa gratis nie daje pieczątki</span>}
    </div>
  );

  return (
    <StaffShell me={me} active="kasa" tabs={screen === "wait"}>
      {screen === "wait" &&
        (wide ? (
          <TabletWaiting today={today} digits={digits} setDigits={setDigits} onOpen={lookup} onCamera={() => setCamera(true)} err={err} />
        ) : (
          <PhoneWaiting me={me} today={today} onCode={lookup} onKeypad={() => setKeypad(true)} paused={keypad} err={err} />
        ))}

      {screen === "guest" && card && (
        <GuestScreen card={card} rewards={rewards} issued={issued} coffees={coffees} stepper={Stepper} onIssue={setDlg} onAdd={addStamps} onCancel={next} busy={busy} err={err} />
      )}

      {screen === "done" && done && <DoneScreen done={done} onUndo={undo} onNext={next} err={err} />}

      {screen === "unknown" && (
        <UnknownScreen
          digits={unknown}
          onRetype={() => {
            setScreen("wait");
            if (!wide) setKeypad(true);
          }}
          onRescan={() => {
            setScreen("wait");
            if (wide) setCamera(true);
          }}
        />
      )}

      {keypad && (
        <Dialog onClose={() => setKeypad(false)}>
          <div className="-mt-2 flex items-center justify-between">
            <span className="text-[18px] font-semibold">Numer karty</span>
            <button onClick={() => setKeypad(false)} aria-label="Zamknij" className="-mr-3.5 grid h-14 w-14 place-items-center">
              <Icon name="x" size={26} />
            </button>
          </div>
          <CardDigits digits={digits} h={64} font={32} />
          <span className={`${SEC} -mt-1 text-[14px]`}>8 cyfr spod kodu w aplikacji gościa</span>
          {err && <p className="text-center text-[15px] text-terra">{err}</p>}
          <Numpad onKey={(k) => setDigits((d) => typeKey(d, k))} keyH={60} />
          <Btn full disabled={digits.length < 8} iconRight="arrow-right" onClick={() => lookup(digits)}>
            Otwórz kartę
          </Btn>
        </Dialog>
      )}

      {camera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] p-8" onClick={() => setCamera(false)}>
          <div className="relative w-full max-w-[720px]" onClick={(e) => e.stopPropagation()}>
            <Scanner onCode={lookup} paused={false} autoStart className="aspect-[4/3]" />
            <button onClick={() => setCamera(false)} aria-label="Zamknij" className="absolute right-3 top-3 grid h-14 w-14 place-items-center rounded-full bg-dark/70 text-cream">
              <Icon name="x" size={26} />
            </button>
          </div>
        </div>
      )}

      {dlg && card && (
        <Dialog onClose={() => setDlg(null)}>
          <span className={OVERLINE}>Wydanie nagrody</span>
          <p className="text-[22px] font-semibold leading-[1.3] lg:text-[28px] lg:leading-[1.25]">{till(dlg).title}</p>
          <p className={`${SEC} lg:text-[17px]`}>
            {card.name} · {till(dlg).sub}
          </p>
          <p className="mt-1.5 rounded-xl bg-sand px-4 py-3.5 text-[15px] leading-[1.45] lg:text-[16px]">
            Zapiszemy: wydał{fem(me.name) ? "a" : ""} {me.name}, {nowWarsaw().date}, {nowWarsaw().time}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Btn variant="secondary" onClick={() => setDlg(null)} className="lg:min-h-16">
              Anuluj
            </Btn>
            <Btn icon="check" onClick={() => issue(dlg)} className="lg:min-h-16">
              Wydaj
            </Btn>
          </div>
        </Dialog>
      )}
    </StaffShell>
  );
}

const typeKey = (d: string, k: string) => (k === "C" ? "" : k === "<" ? d.slice(0, -1) : d.length < 8 ? d + k : d);

function CardDigits({ digits, h, font }: { digits: string; h: number; font: number }) {
  return (
    <div
      className={`flex items-center justify-center rounded-[14px] border-2 bg-white font-mono tracking-[.08em] tabular-nums ${digits ? "border-gold text-ink" : "border-[var(--line-strong)] text-[#b7aca3]"}`}
      style={{ height: h, fontSize: font }}
    >
      {fmtCard(digits).replace(/_/g, "·")}
    </div>
  );
}

function statsOf(today: Today | null, short: boolean): [string, number | string][] {
  return [
    ["Skany", today?.stats.scans ?? "–"],
    ["Nowe karty", today?.stats.newCards ?? "–"],
    [short ? "Nagrody" : "Wydane nagrody", today?.stats.rewards ?? "–"],
  ];
}

function TodayRows({ rows, max, compact }: { rows: Row[]; max: number; compact?: boolean }) {
  if (rows.length === 0) return <div className="card p-4 text-[15px] text-ink-2">Jeszcze nic dzisiaj</div>;
  const hhmm = (s: string) => new Date(s.replace(" ", "T") + "Z").toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
  return (
    <div className="card divide-y divide-line overflow-hidden">
      {rows.slice(0, max).map((r) =>
        compact ? (
          <div key={r.id} className="grid min-h-14 grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-2.5 px-3">
            <span className={`${SEC} tabular-nums`}>{hhmm(r.time)}</span>
            <span className="min-w-0 py-2">
              <span className="block text-[15px] font-semibold leading-[1.25]">{r.guest}</span>
              <span className={`block truncate text-[14px] ${r.reward ? "font-semibold text-gold-ink" : "text-ink-2"}`}>{r.text}</span>
            </span>
            <span className="text-[13px] text-ink-2">{r.staff}</span>
          </div>
        ) : (
          <div key={r.id} className="grid min-h-14 grid-cols-[64px_130px_minmax(0,1fr)_auto] items-center gap-3 px-[18px]">
            <span className="text-[16px] text-ink-2 tabular-nums">{hhmm(r.time)}</span>
            <span className="text-[16px] font-semibold leading-[1.3]">{r.guest}</span>
            <span className={`truncate text-[16px] ${r.reward ? "font-semibold text-gold-ink" : ""}`}>{r.text}</span>
            <span className="text-[14px] text-ink-2">{r.staff}</span>
          </div>
        ),
      )}
    </div>
  );
}

function TabletWaiting({ today, digits, setDigits, onOpen, onCamera, err }: { today: Today | null; digits: string; setDigits: (f: (d: string) => string) => void; onOpen: (d: string) => void; onCamera: () => void; err: string }) {
  const now = nowWarsaw();
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_400px] gap-6 p-7">
      <div className="flex min-h-0 flex-col gap-5">
        <button onClick={onCamera} className="flex h-[272px] flex-none items-center gap-8 rounded-[28px] border-2 border-dashed border-[var(--line-accent)] bg-white px-10 text-left">
          <span className="grid h-[132px] w-[132px] flex-none place-items-center rounded-[28px] bg-[var(--gold-12)]">
            <Icon name="qr-code" size={72} stroke="var(--gold-ink)" strokeWidth={1.5} />
          </span>
          <span className="flex flex-col gap-2.5">
            <span className="font-serif text-[52px] leading-[1.1]">Zeskanuj kod gościa</span>
            <span className={`${SEC} text-[17px]`}>Skaner albo kamera — zanim nabijesz zamówienie na iPOS</span>
            <span className="mt-1.5 flex gap-2.5">
              <Pill tone="green" icon="check-circle">Skaner gotowy</Pill>
              <Pill icon="camera">Kamera: dotknij</Pill>
            </span>
          </span>
        </button>
        {err && <p className="rounded-xl bg-[rgba(176,112,95,.14)] px-4 py-3 text-[16px] text-terra">{err}</p>}
        <span className={OVERLINE}>
          Dzisiaj · {now.weekday} {now.date}
        </span>
        <div className="-mt-2 grid grid-cols-3 gap-3">
          {statsOf(today, false).map(([l, v]) => (
            <div key={l} className="card flex items-baseline gap-3 px-[18px] py-3.5">
              <span className="text-[34px] font-semibold leading-none tabular-nums">{v}</span>
              <span className={SEC}>{l}</span>
            </div>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{today && <TodayRows rows={today.rows} max={30} />}</div>
      </div>
      <div className="card flex flex-col gap-3.5 p-5">
        <label className="text-[16px] font-semibold leading-[1.2]">Numer karty</label>
        <CardDigits digits={digits} h={76} font={38} />
        <span className={`${SEC} -mt-1 text-[14px]`}>8 cyfr spod kodu w aplikacji gościa</span>
        <Numpad onKey={(k) => setDigits((d) => typeKey(d, k))} />
        <Btn full disabled={digits.length < 8} iconRight="arrow-right" onClick={() => onOpen(digits)} className="mt-auto min-h-16">
          Otwórz kartę
        </Btn>
      </div>
    </div>
  );
}

function PhoneWaiting({ me, today, onCode, onKeypad, paused, err }: { me: Me; today: Today | null; onCode: (c: string) => void; onKeypad: () => void; paused: boolean; err: string }) {
  return (
    <>
      <div className="flex flex-none items-center gap-2.5 px-5 pb-3 pt-3">
        <h1 className="flex-1 font-serif text-[32px] leading-[1.15]">Kasa</h1>
        {isOwner(me) && (
          <button onClick={switchPerson} className="flex min-h-12 items-center gap-2 rounded-full border border-[var(--line-strong)] bg-white py-1 pl-1.5 pr-3">
            <span className="h-[34px] w-[34px] rounded-full bg-dark text-center text-[15px] font-semibold leading-[34px] text-cream">{me.name[0]}</span>
            <span className="text-left text-[14px] font-semibold leading-[1.2]">
              {me.name}
              <span className="block text-[12px] font-medium text-gold-ink">Zmień osobę</span>
            </span>
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3 px-5">
        <Scanner onCode={onCode} paused={paused} autoStart className="h-[250px]" />
        <Btn variant="secondary" full icon="pencil" onClick={onKeypad}>
          Wpisz numer karty
        </Btn>
        {err && <p className="rounded-xl bg-[rgba(176,112,95,.14)] px-4 py-3 text-center text-[15px] text-terra">{err}</p>}
        <span className={`${OVERLINE} mt-1.5`}>Dzisiaj · {nowWarsaw().date}</span>
        <div className="grid grid-cols-3 gap-2">
          {statsOf(today, true).map(([l, v]) => (
            <div key={l} className="card px-3 py-2.5">
              <div className="text-[24px] font-semibold leading-none tabular-nums">{v}</div>
              <div className={`${SEC} mt-1 text-[13px]`}>{l}</div>
            </div>
          ))}
        </div>
        {today && <TodayRows rows={today.rows} max={isOwner(me) ? 3 : 5} compact />}
        {!isOwner(me) && <p className={`${SEC} text-center text-[13px]`}>{me.name} · {roleLabel(me)}</p>}
      </div>
    </>
  );
}

function GuestScreen(p: {
  card: Card;
  rewards: Reward[];
  issued: Record<number, string>;
  coffees: number;
  stepper: (size: number) => React.ReactNode;
  onIssue: (r: Reward) => void;
  onAdd: () => void;
  onCancel: () => void;
  busy: boolean;
  err: string;
}) {
  const { card, coffees } = p;
  const ov = overflowLine(card.display, coffees);
  const rewardList = (
    <>
      <span className={OVERLINE}>Nagrody do wydania teraz</span>
      {p.rewards.length === 0 && <p className={`${SEC} py-2 lg:py-[18px] lg:text-[17px]`}>Brak nagród do wydania</p>}
      {p.rewards.map((r) => {
        const t = till(r);
        const done = p.issued[r.id];
        return (
          <div
            key={r.id}
            className="card flex items-center gap-3 py-2.5 pl-3.5 pr-2.5 lg:gap-4 lg:py-3.5 lg:pl-[18px] lg:pr-3.5"
            style={{ border: t.main && !done ? "1.5px solid var(--gold)" : undefined, opacity: done ? 0.75 : 1 }}
          >
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full lg:h-[52px] lg:w-[52px]" style={{ background: r.type === "birthday" ? "var(--sand-2)" : "var(--gold-12)" }}>
              <Icon name={t.icon} size={24} stroke="var(--gold-ink)" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[15px] font-semibold leading-[1.3] lg:text-[19px] ${done ? "line-through" : ""}`}>{t.title}</span>
              <span className={`block ${SEC} text-[13px] lg:text-[15px]`}>{t.sub}</span>
            </span>
            {done ? (
              <Pill tone="green" icon="check" className="px-2.5 py-1 text-[13px] lg:text-[14px]">
                Wydano {done}
              </Pill>
            ) : (
              <Btn variant={t.main ? "primary" : "secondary"} onClick={() => p.onIssue(r)} className="min-w-[84px] px-3 lg:min-w-32">
                Wydaj
              </Btn>
            )}
          </div>
        );
      })}
    </>
  );
  const head = (
    <>
      <div>
        <h1 className="font-serif text-[40px] leading-[1.1] lg:text-[56px]">{card.name}</h1>
        <p className="mt-0.5 text-[16px] font-medium leading-[1.3] text-ink-2 tabular-nums lg:mt-1 lg:text-[18px]">{card.visit}. wizyta</p>
      </div>
      {card.birthdayThisWeek && (
        <div className="flex flex-wrap gap-2">
          <Pill tone="rose" icon="gift">Urodziny w tym tygodniu</Pill>
        </div>
      )}
    </>
  );
  const bottom = (
    <div className="flex flex-col gap-2.5">
      {ov && (
        <div className="self-start">
          <Pill tone="gold" icon="info" className="lg:px-3.5 lg:py-2 lg:text-[16px]">{ov}</Pill>
        </div>
      )}
      {p.err && <p className="text-[15px] text-terra">{p.err}</p>}
      <div className="flex items-center gap-2.5 lg:gap-5">
        <div className="lg:hidden">{p.stepper(56)}</div>
        <div className="hidden lg:block">{p.stepper(76)}</div>
        <Btn disabled={coffees < 1 || p.busy} onClick={p.onAdd} className="min-h-16 flex-1 whitespace-nowrap !px-2.5 lg:min-h-[76px] lg:rounded-2xl lg:text-[21px]">
          <span className="inline-flex items-center gap-2">
            <span className="hidden lg:inline-flex"><Icon name="plus" size={22} /></span>
            Dodaj {coffees} {stampAcc(coffees)}
          </span>
        </Btn>
      </div>
    </div>
  );
  return (
    <>
      <div className="flex flex-none items-center justify-between px-5 pt-2 lg:px-7 lg:pt-5">
        <Btn variant="ghost" icon="x" onClick={p.onCancel} className="-ml-3.5 text-ink lg:-ml-3">
          Anuluj
        </Btn>
        <span className="font-mono text-[14px] text-ink-2 tabular-nums lg:text-[16px]">
          <span className="hidden lg:inline">Karta </span>
          {fmtCard(card.cardNumber)}
        </span>
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-3.5 px-5 pb-[190px] pt-1 lg:hidden">
        {head}
        <StampCard stamps={card.display} />
        <div className="mt-1 flex flex-col gap-3.5">{rewardList}</div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream px-5 pt-3 lg:hidden" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
        {bottom}
      </div>

      {/* Tablet */}
      <div className="hidden min-h-0 flex-1 flex-col gap-5 px-7 pb-7 pt-5 lg:flex">
        <div className="grid min-h-0 flex-1 grid-cols-[353px_minmax(0,1fr)] gap-10">
          <div className="flex flex-col gap-[18px]">
            {head}
            <StampCard stamps={card.display} />
          </div>
          <div className="flex min-w-0 flex-col gap-3 overflow-y-auto">{rewardList}</div>
        </div>
        {bottom}
      </div>
    </>
  );
}

function DoneScreen({ done, onUndo, onNext, err }: { done: Done; onUndo: () => void; onNext: () => void; err: string }) {
  const [left, setLeft] = useState(10);
  useEffect(() => {
    if (left <= 0) {
      onNext();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onNext]);
  const res = Math.min(done.before + done.n, 9);
  const ov = overflowLine(done.before, done.n);
  const line = done.fullCards > 0 ? "Darmowa kawa czeka" : nextRewardLine(done.stamps);
  const f = fem(done.by);
  return (
    <div className="flex flex-1 flex-col px-5 pb-[calc(24px+env(safe-area-inset-bottom))] lg:items-center lg:justify-center lg:p-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center lg:flex-none lg:gap-[22px]">
        <span className="anim-pop grid h-[104px] w-[104px] place-items-center rounded-full bg-green text-cream lg:h-[132px] lg:w-[132px]">
          <Icon name="check" size={60} strokeWidth={2.5} />
        </span>
        <div className="flex items-baseline gap-2.5 text-[32px] font-semibold leading-[1.15] tabular-nums lg:gap-4 lg:text-[52px]">
          +{done.n} {stampNom(done.n)} ·
          <span className="lg:hidden"><Counter value={res} size={32} /></span>
          <span className="hidden lg:inline"><Counter value={res} size={52} /></span>
        </div>
        {ov && <Pill tone="gold" icon="info" className="text-[15px] lg:px-[18px] lg:py-2.5 lg:text-[18px]">{ov}</Pill>}
        <p className={`${SEC} text-[16px] lg:text-[19px]`}>
          {done.guest.name} · {line}
          <br className="lg:hidden" />
          <span className="lg:hidden">Dodał{f ? "a" : ""} {done.by} o {done.at}</span>
          <span className="hidden lg:inline"> · dodał{f ? "a" : ""} {done.by} o {done.at}</span>
        </p>
        <p className={`${SEC} text-[14px] lg:text-[15px]`}>Teraz nabij zamówienie na iPOS</p>
        {err && <p className="text-[15px] text-terra">{err}</p>}
      </div>
      <div className="flex flex-col gap-2.5 lg:mt-[18px] lg:flex-row lg:gap-4">
        <button
          onClick={onUndo}
          className="relative flex h-16 items-center justify-center gap-2 overflow-hidden rounded-[14px] border-[1.5px] border-dark bg-white text-[19px] font-semibold tabular-nums lg:h-[76px] lg:min-w-[300px] lg:rounded-2xl lg:text-[21px]"
        >
          <span className="absolute bottom-0 left-0 h-[5px] bg-gold transition-[width] duration-1000 ease-linear" style={{ width: `${left * 10}%` }} />
          Cofnij <span className="font-medium text-ink-2">{left} s</span>
        </button>
        <Btn variant="dark" onClick={onNext} className="min-h-16 lg:min-h-[76px] lg:min-w-[300px] lg:rounded-2xl lg:text-[21px]">
          Następny gość
        </Btn>
      </div>
    </div>
  );
}

function UnknownScreen({ digits, onRetype, onRescan }: { digits: string; onRetype: () => void; onRescan: () => void }) {
  const isNum = /^\d{1,8}$/.test(digits);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3.5 px-5 pb-[calc(24px+env(safe-area-inset-bottom))] text-center lg:gap-[18px] lg:p-10">
      <span className="grid h-[88px] w-[88px] place-items-center rounded-full bg-[rgba(176,112,95,.14)] text-terra lg:h-[104px] lg:w-[104px]">
        <Icon name="circle-alert" size={52} strokeWidth={1.75} />
      </span>
      <h1 className="font-serif text-[32px] leading-[1.15] lg:text-[48px]">{isNum ? "Nie znamy tego numeru" : "Nie znamy tego kodu"}</h1>
      {isNum && <div className="font-mono text-[32px] tracking-[.08em] tabular-nums lg:text-[44px]">{fmtCard(digits)}</div>}
      <p className={`${SEC} max-w-[620px] lg:text-[18px]`}>Sprawdź cyfry z gościem. Numer stoi pod kodem w aplikacji — po stuknięciu powiększa się na cały ekran.</p>
      <div className="mt-2.5 flex w-full flex-col gap-3 lg:mt-3.5 lg:w-auto lg:flex-row lg:gap-4">
        <Btn icon="pencil" onClick={onRetype} className="lg:min-h-[76px] lg:min-w-[300px] lg:rounded-2xl lg:text-[21px]">
          <span className="lg:hidden">Spróbuj ponownie</span>
          <span className="hidden lg:inline">Wpisz ponownie</span>
        </Btn>
        <Btn variant="secondary" icon="qr-code" onClick={onRescan} className="hidden lg:inline-flex lg:min-h-[76px] lg:min-w-[300px] lg:rounded-2xl lg:text-[21px]">
          Zeskanuj ponownie
        </Btn>
      </div>
    </div>
  );
}

function Scanner({ onCode, paused, autoStart, className = "" }: { onCode: (c: string) => void; paused: boolean; autoStart?: boolean; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "on" | "denied">("idle");
  const scanner = useRef<{ stop: () => void; start: () => Promise<void>; destroy: () => void } | null>(null);
  const lastCode = useRef({ code: "", at: 0 });
  const cb = useRef(onCode);
  cb.current = onCode;

  const start = useCallback(async () => {
    if (!video.current || scanner.current) return;
    const QrScanner = (await import("qr-scanner")).default;
    const s = new QrScanner(
      video.current,
      (res) => {
        const now = Date.now();
        if (res.data === lastCode.current.code && now - lastCode.current.at < 3000) return;
        lastCode.current = { code: res.data, at: now };
        cb.current(res.data);
      },
      { preferredCamera: "environment", maxScansPerSecond: 8, returnDetailedScanResult: true },
    );
    scanner.current = s;
    try {
      await s.start();
      setState("on");
    } catch {
      setState("denied");
      s.destroy();
      scanner.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoStart) start();
    return () => {
      scanner.current?.destroy();
      scanner.current = null;
    };
  }, [start, autoStart]);

  useEffect(() => {
    const s = scanner.current;
    if (!s) return;
    if (paused) s.stop();
    else s.start().catch(() => setState("denied"));
  }, [paused]);

  const corner = "absolute h-11 w-11 border-gold";
  return (
    <button type="button" onClick={() => state !== "on" && start()} className={`relative flex-none overflow-hidden rounded-3xl bg-dark text-cream ${className}`}>
      <video ref={video} className={`absolute inset-0 h-full w-full object-cover ${state === "on" ? "" : "invisible"}`} muted playsInline />
      <span className="pointer-events-none absolute inset-[14%_22%]">
        <span className={`${corner} left-0 top-0 rounded-tl-[14px] border-l-4 border-t-4`} />
        <span className={`${corner} right-0 top-0 rounded-tr-[14px] border-r-4 border-t-4`} />
        <span className={`${corner} bottom-0 left-0 rounded-bl-[14px] border-b-4 border-l-4`} />
        <span className={`${corner} bottom-0 right-0 rounded-br-[14px] border-b-4 border-r-4`} />
      </span>
      {state !== "on" ? (
        <span className="relative flex h-full flex-col items-center justify-center gap-2.5">
          <Icon name="camera" size={30} />
          <span className="text-[18px] font-semibold leading-[1.3]">Zeskanuj kod gościa</span>
          <span className="text-[14px] leading-[1.3] opacity-80">{state === "denied" ? "Brak dostępu do aparatu — wpisz numer" : "Przed nabiciem na iPOS"}</span>
        </span>
      ) : (
        <span className="absolute inset-x-0 bottom-3 text-center text-[14px] font-medium drop-shadow">Przed nabiciem na iPOS</span>
      )}
    </button>
  );
}
