"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import Counter from "@/components/Counter";
import StaffShell from "../StaffShell";
import { Btn, Dialog, OVERLINE, PageHeader, Pill, SEC, Toast, post, type Me } from "../ui";

type Claim = { id: number; purchased_at: string; comment: string | null; created_at: string; name: string; card_number: string; stamps: number; month_count: number };

const utc = (s: string) => new Date(s.replace(" ", "T") + "Z");
const sentLabel = (s: string) => {
  const d = utc(s);
  const o = { timeZone: "Europe/Warsaw" } as const;
  return `${d.toLocaleDateString("pl-PL", { ...o, day: "2-digit", month: "2-digit" })}, ${d.toLocaleTimeString("pl-PL", { ...o, hour: "2-digit", minute: "2-digit" })}`;
};
const buyLabel = (s: string) => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}, ${Number(m[4])}:${m[5]}` : s;
};
const isLate = (c: Claim) => Date.now() - utc(c.created_at).getTime() > 24 * 3600 * 1000;

export default function Zgloszenia({ me }: { me: Me }) {
  const [list, setList] = useState<Claim[] | null>(null);
  const [cur, setCur] = useState<Claim | null>(null);
  const [zoom, setZoom] = useState(false);
  const [reject, setReject] = useState(false);
  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    fetch("/api/staff/claims", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { claims: [] }))
      .then((j) => setList(j.claims));
  }, []);
  useEffect(load, [load]);

  async function resolve(action: "add" | "reject") {
    if (!cur) return;
    const { ok, j } = await post("/api/staff/claims/resolve", { id: cur.id, action });
    if (!ok) return setErr(j.error ?? "Nie udało się.");
    setToast(action === "add" ? `Dodano pieczątkę · ${cur.name} zobaczy ją w aplikacji` : `Zgłoszenie zamknięte · ${cur.name} dostanie wiadomość`);
    setReject(false);
    setCur(null);
    setErr("");
    load();
    window.dispatchEvent(new Event("velure:claims"));
  }

  if (!cur)
    return (
      <StaffShell me={me} active="zgl">
        <div className="mx-auto flex w-full max-w-[640px] flex-col">
          <PageHeader title="Zgłoszenia" right={list && list.length > 0 && <span className={SEC}>od najstarszego</span>} />
          {list === null ? null : list.length === 0 ? (
            <p className={`${SEC} px-5 py-6 lg:px-10`}>Brak zgłoszeń</p>
          ) : (
            <div className="flex flex-col gap-2.5 px-5 lg:px-10">
              {list.map((r) => (
                <button key={r.id} onClick={() => setCur(r)} className="card flex min-h-[88px] items-center gap-3 py-3.5 pl-4 pr-3 text-left">
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[17px] font-semibold leading-[1.3]">{r.name}</span>
                      {isLate(r) && (
                        <Pill tone="red" icon="clock" className="px-[9px] py-[3px] text-[13px]">
                          ponad 24 h
                        </Pill>
                      )}
                    </span>
                    <span className={`${SEC} tabular-nums`}>Zakup {buyLabel(r.purchased_at)}</span>
                    {r.comment && <span className="truncate text-[15px] leading-[1.45]">„{r.comment}”</span>}
                  </span>
                  <Icon name="chevron-right" size={24} stroke="var(--ink-2)" />
                </button>
              ))}
            </div>
          )}
        </div>
        {toast && <Toast message={toast} onDone={() => setToast("")} />}
      </StaffShell>
    );

  return (
    <StaffShell me={me} active="zgl" tabs={false}>
      <div className="mx-auto flex w-full max-w-[640px] flex-col">
        <PageHeader title="Zgłoszenie" onBack={() => setCur(null)} />
        <div className="flex flex-col gap-4 px-5 pb-[140px] lg:px-10">
          <button onClick={() => setZoom(true)} className="relative cursor-zoom-in overflow-hidden rounded-2xl bg-sand">
            <img src={`/api/staff/claims/${cur.id}/photo`} alt="Zdjęcie paragonu" className="aspect-[4/3] w-full object-cover" />
            <span className="absolute bottom-2.5 right-2.5">
              <Pill tone="dark" icon="search">Powiększ</Pill>
            </span>
          </button>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[22px] font-semibold leading-[1.3]">{cur.name}</span>
              <span className="flex items-baseline gap-1.5">
                <span className={SEC}>karta</span>
                <Counter value={cur.stamps} size={18} />
              </span>
            </div>
            <div className="mt-2.5">
              <InfoRow label="Data i godzina zakupu">{buyLabel(cur.purchased_at)}</InfoRow>
              <InfoRow label="Wysłano">{sentLabel(cur.created_at)}</InfoRow>
              <InfoRow label="Zgłoszenia w tym miesiącu">{cur.month_count}</InfoRow>
              {cur.comment && (
                <div className="border-t border-line py-3.5">
                  <div className={SEC}>Komentarz</div>
                  <div className="mt-1 text-[16px] leading-[1.45]">„{cur.comment}”</div>
                </div>
              )}
            </div>
            {err && <p className="text-[15px] text-terra">{err}</p>}
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-[1fr_1.4fr] gap-3 border-t border-line bg-cream px-5 pt-3 lg:left-[112px] lg:px-10" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
        <Btn variant="secondary" onClick={() => setReject(true)}>Odrzuć</Btn>
        <Btn icon="plus" onClick={() => resolve("add")}>Dodaj pieczątkę</Btn>
      </div>

      {zoom && (
        <button onClick={() => setZoom(false)} className="fixed inset-0 z-50 flex flex-col gap-3 bg-dark px-3 pb-10 pt-[calc(16px+env(safe-area-inset-top))] text-left">
          <span className="flex items-center justify-between px-2 text-[15px] font-medium text-cream">
            <span>Paragon · {buyLabel(cur.purchased_at)}</span>
            <span className="grid h-14 w-14 place-items-center"><Icon name="x" size={28} /></span>
          </span>
          <span className="min-h-0 flex-1 overflow-auto" style={{ touchAction: "pinch-zoom" }}>
            <img src={`/api/staff/claims/${cur.id}/photo`} alt="Paragon" className="mx-auto h-full w-full object-contain" />
          </span>
          <span className="text-center text-[14px] text-cream opacity-80">Rozsuń dwoma palcami, żeby powiększyć</span>
        </button>
      )}

      {reject && (
        <Dialog onClose={() => setReject(false)}>
          <p className="text-[22px] font-semibold leading-[1.3]">Odrzucić zgłoszenie?</p>
          <span className={OVERLINE}>{cur.name} zobaczy</span>
          <div className="card flex flex-col gap-3 p-4">
            <p className="text-[16px] font-semibold leading-[1.35]">Nie znaleźliśmy tej transakcji.</p>
            <p className="text-[15px] leading-[1.45]">Sprawdź, czy data na paragonie się zgadza. Jeśli tak — napisz do nas, sprawdzimy razem.</p>
          </div>
          <Btn variant="dark" full onClick={() => resolve("reject")}>Odrzuć i wyślij wiadomość</Btn>
          <Btn variant="ghost" full onClick={() => setReject(false)}>Anuluj</Btn>
        </Dialog>
      )}
    </StaffShell>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-t border-line py-3.5">
      <span className={SEC}>{label}</span>
      <span className="text-right text-[16px] font-medium leading-[1.45] tabular-nums">{children}</span>
    </div>
  );
}
