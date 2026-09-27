"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { ComboCard, PromoCard } from "@/components/Promo";
import { MENU } from "@/lib/menu";
import StaffShell from "../StaffShell";
import { Btn, Dialog, OVERLINE, PageHeader, Pill, SEC, Toast, post, type Me } from "../ui";

type News = { id: number; title: string; description: string | null; price: number | null; photo: string; ends_on: string; status: "active" | "ended" };
type Combo = { id: number; items: { name: string; price: number }[]; price: number; window: string; ends_on: string; status: "active" | "ended" };
type Screen = "list" | "new" | "preview" | "set" | "setPreview";

const MENU_ITEMS = MENU.flatMap((s) => s.groups.flatMap((g) => g.items.map((i) => ({ name: i.name, price: i.price, section: g.title ?? s.title, photo: i.photo }))));
const priceOf = (n: string) => MENU_ITEMS.find((i) => i.name === n)?.price ?? 0;
const photoOf = (names: string[]) => {
  for (const n of names) {
    const p = MENU_ITEMS.find((i) => i.name === n)?.photo;
    if (p) return `/img/menu/${p}-hero.webp`;
  }
  return "/img/brand/seating.webp";
};
const plDate = (iso: string) => iso.split("-").reverse().join(".");
const shortDate = (iso: string) => iso.split("-").reverse().slice(0, 2).join(".");
const todayIso = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
const DAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

function windowLabel(days: string, from: string, to: string) {
  const on = [...days].map((c, i) => (c === "1" ? i : -1)).filter((i) => i >= 0);
  const contiguous = on.every((v, i) => i === 0 || v === on[i - 1] + 1);
  const d = on.length === 7 ? "Codziennie" : contiguous && on.length > 2 ? `${DAYS[on[0]]}–${DAYS[on[on.length - 1]]}` : on.map((i) => DAYS[i]).join(", ");
  return from && to ? `${d} ${from}–${to}` : d;
}

async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b ?? file), "image/jpeg", 0.85));
  } catch {
    return file;
  }
}

export default function Tresci({ me }: { me: Me }) {
  const [screen, setScreen] = useState<Screen>("list");
  const [tab, setTab] = useState<"Nowości" | "Zestawy">("Nowości");
  const [news, setNews] = useState<News[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [ending, setEnding] = useState<{ kind: "news" | "combo"; id: number; title: string } | null>(null);
  const [toast, setToast] = useState("");

  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [fromMenu, setFromMenu] = useState(true);
  const [menuName, setMenuName] = useState("");
  const [ownName, setOwnName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<string[]>([]);
  const [setPrice_, setSetPrice] = useState(0);
  const [days, setDays] = useState("1111111");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [setEnds, setSetEnds] = useState("");

  const load = useCallback(() => {
    fetch("/api/staff/news", { cache: "no-store" }).then((r) => r.json()).then((j) => setNews(j.news ?? []));
    fetch("/api/staff/combos", { cache: "no-store" }).then((r) => r.json()).then((j) => setCombos(j.combos ?? []));
  }, []);
  useEffect(load, [load]);

  const title = fromMenu ? menuName : ownName.trim();

  function resetNew() {
    setPhoto(null);
    setPhotoUrl("");
    setFromMenu(true);
    setMenuName("");
    setOwnName("");
    setDesc("");
    setPrice("");
    setEndsOn("");
    setErr("");
  }
  function resetSet() {
    setItems([]);
    setSetPrice(0);
    setDays("1111111");
    setFrom("");
    setTo("");
    setSetEnds("");
    setErr("");
  }

  async function pickPhoto(f: File | undefined) {
    if (!f) return;
    const b = await shrink(f);
    setPhoto(b);
    setPhotoUrl(URL.createObjectURL(b));
  }

  async function publishNews() {
    if (!photo) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("photo", photo, "photo.jpg");
    fd.append("title", title);
    fd.append("fromMenu", fromMenu ? "1" : "0");
    fd.append("description", desc);
    fd.append("price", price);
    fd.append("endsOn", endsOn);
    const r = await fetch("/api/staff/news", { method: "POST", body: fd });
    setBusy(false);
    if (!r.ok) {
      setErr((await r.json().catch(() => ({}))).error ?? "Nie udało się opublikować.");
      setScreen("new");
      return;
    }
    resetNew();
    setTab("Nowości");
    setScreen("list");
    setToast("Opublikowano · goście zobaczą to na ekranie Start");
    load();
  }

  async function publishSet() {
    setBusy(true);
    const { ok, j } = await post("/api/staff/combos", { items, price: setPrice_, days, hours: from && to ? `${from}–${to}` : null, endsOn: setEnds });
    setBusy(false);
    if (!ok) {
      setErr(j.error ?? "Nie udało się opublikować.");
      setScreen("set");
      return;
    }
    resetSet();
    setTab("Zestawy");
    setScreen("list");
    setToast("Zestaw opublikowany");
    load();
  }

  async function end() {
    if (!ending) return;
    await post(`/api/staff/${ending.kind === "news" ? "news" : "combos"}/${ending.id}`, {}, "DELETE");
    setEnding(null);
    setToast("Zakończono · gość już tego nie zobaczy");
    load();
  }

  const pin = (children: React.ReactNode) => (
    <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-line bg-cream px-5 pt-3 lg:left-[112px] lg:px-10" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2">{children}</div>
    </div>
  );
  const wrap = "mx-auto flex w-full max-w-[640px] flex-col";

  if (screen === "list")
    return (
      <StaffShell me={me} active="tresci">
        <div className={wrap}>
          <PageHeader title="Treści" />
          <div className="mx-5 mb-4 grid grid-cols-2 gap-1 rounded-[14px] bg-sand p-1 lg:mx-10">
            {(["Nowości", "Zestawy"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`min-h-[52px] rounded-[11px] text-[16px] ${tab === t ? "bg-white font-semibold text-ink" : "font-medium text-ink-2"}`} style={tab === t ? { boxShadow: "var(--shadow-card)" } : undefined}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 px-5 lg:px-10">
            {tab === "Zestawy" ? (
              <>
                <div className="card flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2.5">
                    <span className="text-[17px] font-semibold leading-[1.3]">Dodaj kawę do śniadania</span>
                    <Pill tone="green">Aktywny</Pill>
                  </div>
                  <span className="text-[16px] leading-[1.45]">Americano lub Cappuccino tylko +9 zł</span>
                  <span className={SEC}>Do dań z sekcji Śniadania · codziennie · stały w menu</span>
                </div>
                {combos.map((c) => (
                  <button key={c.id} onClick={() => c.status === "active" && setEnding({ kind: "combo", id: c.id, title: c.items.map((i) => i.name).join(" + ") })} className="card flex flex-col gap-2 p-4 text-left">
                    <div className="flex items-start justify-between gap-2.5">
                      <span className="text-[17px] font-semibold leading-[1.3]">{c.items.map((i) => i.name).join(" + ")}</span>
                      <Pill tone={c.status === "active" ? "green" : "neutral"}>{c.status === "active" ? "Aktywny" : "Zakończony"}</Pill>
                    </div>
                    <span className="text-[16px] leading-[1.45] tabular-nums">
                      <span className="text-ink-2 line-through">{c.items.reduce((a, b) => a + b.price, 0)} zł</span> {c.price} zł
                    </span>
                    <span className={SEC}>
                      {c.window} · do {plDate(c.ends_on)}
                    </span>
                  </button>
                ))}
              </>
            ) : news.length === 0 ? (
              <p className={`${SEC} py-6`}>Brak nowości</p>
            ) : (
              news.map((n) => (
                <button key={n.id} onClick={() => n.status === "active" && setEnding({ kind: "news", id: n.id, title: n.title })} className="card flex items-center gap-3 p-3 text-left">
                  <img src={n.photo} alt="" className="h-16 w-16 flex-none rounded-xl object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-semibold leading-[1.3]">{n.title}</span>
                    <span className={SEC}>Do {plDate(n.ends_on)}</span>
                  </span>
                  <Pill tone={n.status === "active" ? "green" : "neutral"}>{n.status === "active" ? "Aktywna" : "Zakończona"}</Pill>
                </button>
              ))
            )}
          </div>
          <div className="px-5 py-3 lg:px-10">
            <Btn
              full
              icon="plus"
              onClick={() => {
                setErr("");
                setScreen(tab === "Zestawy" ? "set" : "new");
              }}
            >
              {tab === "Zestawy" ? "Dodaj zestaw" : "Dodaj nowość"}
            </Btn>
          </div>
        </div>
        {ending && (
          <Dialog onClose={() => setEnding(null)}>
            <span className={OVERLINE}>{ending.kind === "news" ? "Nowość" : "Zestaw"}</span>
            <p className="text-[22px] font-semibold leading-[1.3]">{ending.title}</p>
            <p className="text-[16px] leading-[1.45]">Zakończyć teraz? Zniknie z ekranu Start u gości od razu, przed datą końca.</p>
            <Btn variant="dark" full onClick={end}>Zakończ teraz</Btn>
            <Btn variant="ghost" full onClick={() => setEnding(null)}>Anuluj</Btn>
          </Dialog>
        )}
        {toast && <Toast message={toast} onDone={() => setToast("")} />}
      </StaffShell>
    );

  if (screen === "new" || screen === "preview") {
    const ready = !!photo && !!endsOn && title.length >= 2;
    if (screen === "preview")
      return (
        <StaffShell me={me} active="tresci" tabs={false}>
          <div className={wrap}>
            <PageHeader title="Podgląd" onBack={() => setScreen("new")} />
            <div className="flex flex-col gap-3.5 px-5 pb-[170px] lg:px-10">
              <span className={OVERLINE}>Tak zobaczy to gość na ekranie Start</span>
              <div className="rounded-[28px] bg-sand p-4">
                <p className="mb-3 text-[20px] font-semibold leading-[1.3]">Nowości</p>
                <PromoCard title={title} description={desc || null} image={photoUrl} until={`Do ${shortDate(endsOn)}`} price={price ? `${price} zł` : null} width={280} />
              </div>
              <p className="flex items-center gap-2.5 text-[16px] leading-[1.45]">
                <Icon name="calendar-check" size={22} stroke="var(--gold-ink)" />
                Widoczna od razu do {plDate(endsOn)}. Bez powiadomienia push
              </p>
            </div>
          </div>
          {pin(
            <>
              <Btn full icon="check" disabled={busy} onClick={publishNews}>Opublikuj</Btn>
              <Btn full variant="ghost" onClick={() => setScreen("new")}>Popraw</Btn>
            </>,
          )}
        </StaffShell>
      );
    return (
      <StaffShell me={me} active="tresci" tabs={false}>
        <div className={wrap}>
          <PageHeader
            title="Nowość"
            onBack={() => {
              resetNew();
              setScreen("list");
            }}
          />
          <div className="flex flex-col gap-[18px] px-5 pb-[140px] lg:px-10">
            <Field label="Zdjęcie" req>
              <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
              <input ref={galRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
              {photo ? (
                <button onClick={() => galRef.current?.click()} className="relative overflow-hidden rounded-2xl">
                  <img src={photoUrl} alt="" className="h-[150px] w-full object-cover" />
                  <span className="absolute bottom-2.5 right-2.5"><Pill tone="dark" icon="pencil">Zmień</Pill></span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {([["camera", "Zrób zdjęcie", camRef], ["image", "Z galerii", galRef]] as const).map(([i, l, ref]) => (
                    <button key={l} onClick={() => ref.current?.click()} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-[var(--line-accent)] bg-white text-[15px] font-semibold">
                      <Icon name={i} size={28} stroke="var(--gold-ink)" />
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Nazwa">
              <div className="flex gap-2">
                <button onClick={() => setFromMenu(true)}><Pill tone={fromMenu ? "dark" : "neutral"}>Z menu</Pill></button>
                <button onClick={() => setFromMenu(false)}><Pill tone={fromMenu ? "neutral" : "dark"}>Własna</Pill></button>
              </div>
              {fromMenu ? (
                <select
                  value={menuName}
                  onChange={(e) => {
                    setMenuName(e.target.value);
                    setPrice(String(priceOf(e.target.value) || ""));
                  }}
                  className={box(!!menuName)}
                >
                  <option value="">Wybierz z menu</option>
                  {MENU.map((s) => (
                    <optgroup key={s.id} label={s.title}>
                      {s.groups.flatMap((g) => g.items).map((i) => (
                        <option key={i.name} value={i.name}>
                          {i.name} · {i.price} zł
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <input value={ownName} onChange={(e) => setOwnName(e.target.value)} maxLength={60} placeholder="Np. Dyniowe latte" className={box(!!ownName)} />
              )}
            </Field>
            <Field label="Krótki opis" opt>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={140} placeholder="Jedno zdanie, które zobaczy gość" className={box(!!desc)} />
            </Field>
            <div className="grid grid-cols-[1fr_1.3fr] items-start gap-3">
              <Field label="Cena" opt>
                <div className="relative">
                  <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" placeholder="—" className={`${box(!!price)} pr-10`} />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[17px] text-ink-2">zł</span>
                </div>
              </Field>
              <Field label="Data końca" req error={!endsOn ? "Bez daty nie opublikujesz" : undefined}>
                <input type="date" min={todayIso()} value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className={box(!!endsOn, !endsOn)} />
              </Field>
            </div>
            {err && <p className="text-[15px] text-terra">{err}</p>}
          </div>
        </div>
        {pin(
          <Btn full disabled={!ready} iconRight="arrow-right" onClick={() => setScreen("preview")}>
            Podgląd
          </Btn>,
        )}
      </StaffShell>
    );
  }

  return (
    <SetBuilder
      me={me}
      wrap={wrap}
      pin={pin}
      screen={screen}
      setScreen={setScreen}
      items={items}
      setItems={setItems}
      price={setPrice_}
      setPrice={setSetPrice}
      days={days}
      setDays={setDays}
      from={from}
      setFrom={setFrom}
      to={to}
      setTo={setTo}
      endsOn={setEnds}
      setEndsOn={setSetEnds}
      err={err}
      busy={busy}
      onPublish={publishSet}
      onBack={() => {
        resetSet();
        setScreen("list");
      }}
    />
  );
}

function SetBuilder(p: {
  me: Me;
  wrap: string;
  pin: (c: React.ReactNode) => React.ReactNode;
  screen: Screen;
  setScreen: (s: Screen) => void;
  items: string[];
  setItems: (f: (i: string[]) => string[]) => void;
  price: number;
  setPrice: (f: number | ((n: number) => number)) => void;
  days: string;
  setDays: (d: string) => void;
  from: string;
  setFrom: (s: string) => void;
  to: string;
  setTo: (s: string) => void;
  endsOn: string;
  setEndsOn: (s: string) => void;
  err: string;
  busy: boolean;
  onPublish: () => void;
  onBack: () => void;
}) {
  const sum = useMemo(() => p.items.reduce((a, n) => a + priceOf(n), 0), [p.items]);
  const { setPrice } = p;
  useEffect(() => {
    setPrice(sum ? Math.round(sum * 0.9) : 0);
  }, [sum, setPrice]);
  const pct = sum ? Math.round(((sum - p.price) / sum) * 1000) / 10 : 0;
  const lvl = pct > 20 ? (["red", "Za głęboki rabat", "var(--terra)"] as const) : pct > 15 ? (["warn", "Uwaga", "var(--gold)"] as const) : (["green", "W normie", "var(--green)"] as const);
  const ready = p.items.length >= 2 && p.price > 0 && p.price < sum && !!p.endsOn && p.days.includes("1") && (!p.from || !!p.to) && (!p.to || !!p.from);
  const title = p.items.join(" + ");
  const win = windowLabel(p.days, p.from, p.to);

  if (p.screen === "setPreview")
    return (
      <StaffShell me={p.me} active="tresci" tabs={false}>
        <div className={p.wrap}>
          <PageHeader title="Podgląd" onBack={() => p.setScreen("set")} />
          <div className="flex flex-col gap-3.5 px-5 pb-[170px] lg:px-10">
            <span className={OVERLINE}>Tak zobaczy to gość na ekranie Start</span>
            <div className="rounded-[28px] bg-sand p-4">
              <p className="mb-3 text-[20px] font-semibold leading-[1.3]">Zestawy</p>
              <ComboCard title={title} oldPrice={`${sum} zł`} newPrice={`${p.price} zł`} window={win} image={photoOf(p.items)} />
            </div>
            <p className="flex items-center gap-2.5 text-[16px] leading-[1.45]">
              <Icon name="calendar-check" size={22} stroke="var(--gold-ink)" />
              Widoczny od razu do {plDate(p.endsOn)}
            </p>
          </div>
        </div>
        {p.pin(
          <>
            <Btn full icon="check" disabled={p.busy} onClick={p.onPublish}>Opublikuj</Btn>
            <Btn full variant="ghost" onClick={() => p.setScreen("set")}>Popraw</Btn>
          </>,
        )}
      </StaffShell>
    );

  return (
    <StaffShell me={p.me} active="tresci" tabs={false}>
      <div className={p.wrap}>
        <PageHeader title="Zestaw" onBack={p.onBack} />
        <div className="flex flex-col gap-3 px-5 pb-[130px] lg:px-10">
          <Field label="Pozycje z menu">
            <div className="card divide-y divide-line">
              {p.items.map((n) => (
                <div key={n} className="flex min-h-12 items-center pl-4 pr-1.5">
                  <span className="flex-1 text-[16px]">{n}</span>
                  <span className={`${SEC} tabular-nums`}>{priceOf(n)} zł</span>
                  <button aria-label={`Usuń ${n}`} onClick={() => p.setItems((i) => i.filter((x) => x !== n))} className="grid h-12 w-12 place-items-center text-ink-2">
                    <Icon name="x" size={20} />
                  </button>
                </div>
              ))}
              <label className="relative flex min-h-12 items-center gap-2 px-4 text-[15px] font-semibold text-gold-ink">
                <Icon name="plus" size={20} />
                Dodaj pozycję
                <select
                  value=""
                  onChange={(e) => e.target.value && p.setItems((i) => (i.includes(e.target.value) || i.length >= 6 ? i : [...i, e.target.value]))}
                  className="absolute inset-0 opacity-0"
                  aria-label="Dodaj pozycję"
                >
                  <option value="">Wybierz</option>
                  {MENU.map((s) => (
                    <optgroup key={s.id} label={s.title}>
                      {s.groups.flatMap((g) => g.items).map((i) => (
                        <option key={i.name} value={i.name}>
                          {i.name} · {i.price} zł
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>
          </Field>
          {p.items.length >= 2 && (
            <>
              <Field label="Cena zestawu">
                <div className="flex items-center gap-2.5">
                  <button onClick={() => p.setPrice((x) => Math.max(1, x - 1))} className={`${box(false)} !w-14 justify-center !px-0`} aria-label="Taniej">
                    <Icon name="minus" size={22} />
                  </button>
                  <div className={`${box(true)} flex-1 justify-center text-[24px] font-semibold`}>{p.price} zł</div>
                  <button onClick={() => p.setPrice((x) => Math.min(sum - 1, x + 1))} className={`${box(false)} !w-14 justify-center !px-0`} aria-label="Drożej">
                    <Icon name="plus" size={22} />
                  </button>
                </div>
              </Field>
              <div className="card flex flex-col gap-2.5 p-3.5" style={{ border: `1.5px solid ${lvl[2]}` }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[16px] leading-[1.45] tabular-nums">
                    Osobno {sum} zł · rabat{" "}
                    <b>
                      {sum - p.price} zł ({String(pct).replace(".", ",")}%)
                    </b>
                  </span>
                  <Pill tone={lvl[0]}>{lvl[1]}</Pill>
                </div>
                <div className="relative grid h-2.5 grid-cols-[15fr_5fr_10fr] overflow-hidden rounded-[5px]">
                  <span className="bg-[rgba(91,127,98,.14)]" />
                  <span className="bg-[rgba(190,146,76,.3)]" />
                  <span className="bg-[rgba(176,112,95,.14)]" />
                  <span className="absolute inset-y-0 w-1 rounded-sm bg-dark" style={{ left: `calc(${(Math.min(Math.max(pct, 0), 30) / 30) * 100}% - 2px)` }} />
                </div>
                {pct > 20 && (
                  <p className="flex gap-2 text-[15px] font-semibold leading-[1.35] text-terra">
                    <Icon name="triangle-alert" size={20} />
                    Zestaw może kosztować więcej, niż przyniesie
                  </p>
                )}
              </div>
            </>
          )}
          <Field label="Dni" opt>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d, i) => {
                const on = p.days[i] === "1";
                return (
                  <button
                    key={d}
                    onClick={() => p.setDays(p.days.slice(0, i) + (on ? "0" : "1") + p.days.slice(i + 1))}
                    className={`grid min-h-11 place-items-center rounded-[10px] text-[14px] font-semibold ${on ? "bg-dark text-cream" : "bg-sand text-ink-2"}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Godziny" opt>
              <div className="flex items-center gap-1">
                <input type="time" value={p.from} onChange={(e) => p.setFrom(e.target.value)} className={`${box(!!p.from)} !px-2 text-[15px]`} aria-label="Od" />
                <span className="text-ink-2">–</span>
                <input type="time" value={p.to} onChange={(e) => p.setTo(e.target.value)} className={`${box(!!p.to)} !px-2 text-[15px]`} aria-label="Do" />
              </div>
            </Field>
            <Field label="Data końca" req>
              <input type="date" min={todayIso()} value={p.endsOn} onChange={(e) => p.setEndsOn(e.target.value)} className={box(!!p.endsOn, !p.endsOn)} />
            </Field>
          </div>
          {p.err && <p className="text-[15px] text-terra">{p.err}</p>}
        </div>
      </div>
      {p.pin(
        <Btn full disabled={!ready} iconRight="arrow-right" onClick={() => p.setScreen("setPreview")}>
          Podgląd
        </Btn>,
      )}
    </StaffShell>
  );
}

const box = (on: boolean, err = false) =>
  `flex min-h-14 w-full items-center gap-2.5 rounded-xl border-[1.5px] bg-white px-4 text-[17px] leading-[1.3] tabular-nums outline-none appearance-none ${err ? "border-terra" : on ? "border-gold" : "border-[var(--line-strong)]"}`;

function Field({ label, req, opt, error, children }: { label: string; req?: boolean; opt?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold leading-[1.2]">
        {label}
        {req && <span className="font-medium text-terra"> · obowiązkowo</span>}
        {opt && <span className="font-normal text-ink-2"> · opcjonalnie</span>}
      </span>
      {children}
      {error && <span className="text-[13px] font-medium leading-[1.3] text-terra">{error}</span>}
    </div>
  );
}
