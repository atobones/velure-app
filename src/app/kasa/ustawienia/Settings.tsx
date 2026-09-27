"use client";
import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import StaffShell, { switchPerson } from "../StaffShell";
import { Btn, Dialog, Numpad, OVERLINE, Pill, SEC, Toast, fem, isOwner, post, roleLabel, type Me } from "../ui";

type Person = { id: number; name: string; role: "owner" | "barista"; needsPin: number };
type Dlg = { kind: "add" } | { kind: "remove"; p: Person } | { kind: "pin"; p: Person };

const ROLES: [Person["role"], string, string][] = [
  ["barista", "Barista", "Tylko Kasa: skan, pieczątka, nagroda, Cofnij"],
  ["owner", "Właściciel", "Wszystko: Kasa, Zgłoszenia, Treści, Ustawienia"],
];

export default function Settings({ me }: { me: Me }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [toast, setToast] = useState("");
  const load = useCallback(() => {
    fetch("/api/staff/team", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setPeople(j.people ?? []));
  }, []);
  useEffect(load, [load]);

  const closeWith = (msg: string) => {
    setDlg(null);
    setToast(msg);
    load();
  };

  return (
    <StaffShell me={me} active="ust">
      <div className="flex max-w-[900px] flex-col gap-[18px] px-5 pb-8 pt-3 lg:px-10 lg:pt-7">
        <h1 className="font-serif text-[32px] leading-[1.1] lg:text-[40px]">Ustawienia</h1>
        <span className={OVERLINE}>Osoby</span>
        <div className="card divide-y divide-line">
          {people.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 pl-[18px] pr-3.5">
              <span className="h-12 w-12 flex-none rounded-full bg-dark text-center text-[20px] font-semibold leading-[48px] text-cream">{s.name[0]}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2.5 text-[18px] font-semibold leading-[1.3]">
                  {s.name}
                  <Pill tone={isOwner(s) ? "gold" : "neutral"} className="px-2.5 py-[3px] text-[13px]">
                    {isOwner(s) ? "Właściciel" : "Barista"}
                  </Pill>
                </span>
                <span className={SEC}>
                  {isOwner(s) ? "Dostęp do wszystkiego" : "Tylko Kasa"} · {s.needsPin ? "PIN przy pierwszym logowaniu" : "PIN ustawiony"}
                </span>
              </span>
              <div className="flex w-full gap-2 lg:w-auto">
                <Btn variant="secondary" icon="lock" onClick={() => setDlg({ kind: "pin", p: s })} className="flex-1 lg:flex-none">
                  Zmień PIN
                </Btn>
                {s.id === me.id ? (
                  <span className={`${SEC} flex min-w-[152px] flex-1 items-center justify-center lg:flex-none`}>To Ty</span>
                ) : (
                  <Btn variant="ghost" icon="trash-2" onClick={() => setDlg({ kind: "remove", p: s })} className="min-w-[152px] flex-1 !text-terra lg:flex-none">
                    Usuń dostęp
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Btn variant="secondary" icon="user-plus" onClick={() => setDlg({ kind: "add" })}>
            Dodaj osobę
          </Btn>
          <Btn variant="ghost" icon="log-out" onClick={switchPerson} className="!text-terra">
            Wyloguj
          </Btn>
        </div>
      </div>

      {dlg?.kind === "remove" && <RemoveDialog p={dlg.p} onClose={() => setDlg(null)} onDone={() => closeWith(`${dlg.p.name} nie ma już dostępu`)} />}
      {dlg?.kind === "add" && <AddDialog onClose={() => setDlg(null)} onDone={(name) => closeWith(`Dodano: ${name}. PIN ustawi przy pierwszym logowaniu`)} />}
      {dlg?.kind === "pin" && <PinDialog p={dlg.p} self={dlg.p.id === me.id} onClose={() => setDlg(null)} onDone={() => closeWith(`Nowy PIN dla ${dlg.p.name} zapisany`)} />}
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </StaffShell>
  );
}

function RemoveDialog({ p, onClose, onDone }: { p: Person; onClose: () => void; onDone: () => void }) {
  const [err, setErr] = useState("");
  async function go() {
    const { ok, j } = await post(`/api/staff/team/${p.id}`, {}, "DELETE");
    if (ok) onDone();
    else setErr(j.error ?? "Nie udało się.");
  }
  return (
    <Dialog onClose={onClose}>
      <span className={OVERLINE}>Usuń dostęp</span>
      <p className="text-[24px] font-semibold leading-[1.25] lg:text-[28px]">
        {p.name} — {roleLabel(p)}
      </p>
      <p className="text-[17px] leading-[1.45]">
        {p.name} zniknie z listy „Kto jest przy kasie?” i nie zaloguje się PIN-em. Pieczątki i nagrody, które już dał{fem(p.name) ? "a" : ""}, zostają w historii podpisane imieniem {p.name}.
      </p>
      {err && <p className="text-[15px] text-terra">{err}</p>}
      <div className="mt-2.5 grid grid-cols-2 gap-3">
        <Btn variant="secondary" onClick={onClose} className="min-h-16">Anuluj</Btn>
        <Btn variant="dark" icon="trash-2" onClick={go} className="min-h-16">Usuń dostęp</Btn>
      </div>
    </Dialog>
  );
}

function AddDialog({ onClose, onDone }: { onClose: () => void; onDone: (name: string) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Person["role"]>("barista");
  const [err, setErr] = useState("");
  async function go() {
    const { ok, j } = await post("/api/staff/team", { name, role });
    if (ok) onDone(name.trim());
    else setErr(j.error ?? "Nie udało się.");
  }
  return (
    <Dialog onClose={onClose}>
      <span className={OVERLINE}>Nowa osoba</span>
      <label htmlFor="new-name" className="text-[15px] font-semibold leading-[1.2]">Imię</label>
      <input
        id="new-name"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Wpisz imię"
        maxLength={30}
        className="-mt-1.5 min-h-14 rounded-xl border-[1.5px] border-gold bg-white px-4 text-[18px] outline-none placeholder:text-[#b7aca3]"
      />
      <span className="text-[15px] font-semibold leading-[1.2]">Rola</span>
      <div className="-mt-1.5 grid grid-cols-2 gap-2.5">
        {ROLES.map(([id, l, d]) => {
          const on = role === id;
          return (
            <button key={id} onClick={() => setRole(id)} className={`flex min-h-24 flex-col gap-1 rounded-[14px] bg-white px-3.5 py-3 text-left ${on ? "border-2 border-gold" : "border border-[var(--line-strong)]"}`}>
              <span className="flex items-center justify-between text-[18px] font-semibold leading-[1.2]">
                {l}
                {on && <Icon name="check-circle" size={22} stroke="var(--gold-ink)" />}
              </span>
              <span className={`${SEC} text-[14px]`}>{d}</span>
            </button>
          );
        })}
      </div>
      <p className={`${SEC} text-[14px]`}>Nowa osoba ustawi swój 4-cyfrowy PIN przy pierwszym logowaniu</p>
      {err && <p className="text-[15px] text-terra">{err}</p>}
      <div className="mt-1.5 grid grid-cols-2 gap-3">
        <Btn variant="secondary" onClick={onClose} className="min-h-16">Anuluj</Btn>
        <Btn icon="user-plus" disabled={name.trim().length < 2} onClick={go} className="min-h-16">Dodaj</Btn>
      </div>
    </Dialog>
  );
}

function PinDialog({ p, self, onClose, onDone }: { p: Person; self: boolean; onClose: () => void; onDone: () => void }) {
  const [pin, setPin] = useState("");
  const [first, setFirst] = useState("");
  const [err, setErr] = useState("");
  async function press(k: string) {
    setErr("");
    const next = k === "<" ? pin.slice(0, -1) : k === "C" ? "" : (pin + k).slice(0, 4);
    setPin(next);
    if (next.length < 4) return;
    if (!first) {
      setFirst(next);
      setPin("");
      return;
    }
    if (next !== first) {
      setErr("PIN-y się różnią. Zacznij od nowa.");
      setFirst("");
      setPin("");
      return;
    }
    const { ok, j } = await post(`/api/staff/team/${p.id}`, { pin: next }, "PATCH");
    if (ok) onDone();
    else {
      setErr(j.error ?? "Nie udało się.");
      setFirst("");
      setPin("");
    }
  }
  return (
    <Dialog onClose={onClose}>
      <span className={OVERLINE}>Zmień PIN</span>
      <p className="text-[24px] font-semibold leading-[1.25]">{first ? `Powtórz nowy PIN — ${p.name}` : `Nowy PIN — ${p.name}`}</p>
      <div className="my-2 flex justify-center gap-[22px]">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-[22px] w-[22px] rounded-full border-2 border-dark ${i < pin.length ? "bg-dark" : ""}`} />
        ))}
      </div>
      {err && <p className="text-center text-[15px] text-terra">{err}</p>}
      <Numpad onKey={press} keyH={64} />
      <p className={`${SEC} text-[14px]`}>{self ? "Stary PIN przestanie działać od razu." : `${p.name} zostanie wylogowan${fem(p.name) ? "a" : "y"} na innych urządzeniach.`}</p>
      <Btn variant="ghost" full onClick={onClose}>Anuluj</Btn>
    </Dialog>
  );
}
