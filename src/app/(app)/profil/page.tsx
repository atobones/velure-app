"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { LangSwitch, SectionLabel, Sheet, SheetTitle, Toggle } from "@/components/ui";
import { useMe } from "@/components/useMe";
import { setLangEverywhere, useT } from "@/components/useT";
import { CAFE } from "@/lib/menu";
import { formatCard } from "@/lib/pl";

function Row({ icon, title, hint, trailing, href, onClick, danger, last }: { icon: string; title: string; hint?: string; trailing?: React.ReactNode; href?: string; onClick?: () => void; danger?: boolean; last?: boolean }) {
  const body = (
    <>
      <Icon name={icon} size={20} stroke={danger ? "var(--terra)" : "var(--ink-2)"} />
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-medium leading-[1.35] ${danger ? "text-terra" : ""}`}>{title}</span>
        {hint && <span className="block text-[13px] leading-[1.35] text-ink-2">{hint}</span>}
      </span>
      {trailing ?? <Icon name="chevron" size={18} stroke="var(--ink-2)" />}
    </>
  );
  const cls = `flex min-h-11 w-full items-center gap-3 py-3 text-left ${last ? "" : "border-b border-line"}`;
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button onClick={onClick} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

export default function Profil() {
  const { me, reload } = useMe();
  const { t, lang } = useT();
  const [bday, setBday] = useState("");
  const [bdayErr, setBdayErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!me) return <main className="p-6 text-ink-2">{t.loading}</main>;

  const setting = async (body: Record<string, unknown>) => {
    await fetch("/api/guest/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    reload();
  };

  async function saveBday() {
    setBdayErr("");
    const r = await fetch("/api/guest/birthday", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date: bday }) });
    const j = await r.json();
    if (!r.ok) return setBdayErr(j.error);
    reload();
  }

  async function post(url: string) {
    await fetch(url, { method: "POST" });
    window.location.href = "/witaj";
  }

  return (
    <main className="px-5 pt-[calc(16px+env(safe-area-inset-top))]">
      <div className="flex items-center gap-3 pb-4 pt-1">
        <img src="/img/brand/monogram.png" alt="" width={26} height={26} />
        <h1 className="font-serif text-[28px] leading-[1.2]">{t.profileTitle}</h1>
      </div>

      <div className="flex flex-col gap-4 pb-8">
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <img src="/img/brand/monogram.png" alt="" width={44} height={44} />
            <div className="min-w-0">
              <p className="font-serif text-[28px] leading-[1.15]">{me.name}</p>
              <p className="text-[14px] text-ink-2">{t.signedWith(me.provider)}</p>
            </div>
          </div>
          <p className="mt-3 text-[14px] text-ink-2">{t.noPassword}</p>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-sand px-5 py-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-2">{t.cardNumber}</p>
              <p className="text-[24px] font-semibold tracking-[0.08em]" style={{ fontVariantNumeric: "lining-nums tabular-nums" }}>{formatCard(me.cardNumber)}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(me.cardNumber);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="btn-line px-4 text-[15px]"
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
        </section>

        <div>
          <SectionLabel>{t.myCard}</SectionLabel>
          <section className="card px-4">
            <Row icon="history" title={t.history} hint={t.historyHint} href="/profil/historia" last />
          </section>
        </div>

        <div id="urodziny">
          <SectionLabel>{t.birthdayTitle}</SectionLabel>
          <section className="card p-4">
            <div className="flex gap-3">
              <Icon name="cake" stroke="var(--gold)" />
              <div>
                <p className="text-[15px] font-medium">{t.birthdayRewardTitle}</p>
                <p className="text-[13px] leading-[1.45] text-ink-2">{t.birthdayRewardBody}</p>
              </div>
            </div>
            {me.birthday ? (
              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-sand px-5 py-4">
                <span className="text-[22px] font-semibold">{me.birthday}</span>
                <span className="text-right text-[13px] text-ink-2">{t.birthdaySaved}</span>
              </div>
            ) : (
              <>
                <p className="mt-4 text-[14px] text-ink-2">{t.birthdayDate}</p>
                <div className="mt-1 flex gap-2">
                  <input value={bday} onChange={(e) => setBday(e.target.value)} inputMode="decimal" placeholder="dd.mm" className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-white px-4 text-[17px] outline-none focus:border-gold" />
                  <button onClick={saveBday} className="btn-line px-5">{t.save}</button>
                </div>
                {bdayErr && <p className="mt-2 text-[14px] text-terra">{bdayErr}</p>}
              </>
            )}
          </section>
        </div>

        <div>
          <SectionLabel>{t.settings}</SectionLabel>
          <section className="card px-4">
            <Row
              icon="globe"
              title={t.language}
              trailing={
                <LangSwitch
                  value={lang}
                  onChange={(l) => {
                    setLangEverywhere(l);
                    setting({ lang: l });
                  }}
                />
              }
            />
            <Row icon="bell" title={t.notifications} hint={t.notificationsHint} trailing={<Toggle label={t.notifications} checked={me.notifications} onChange={(v) => setting({ notifications: v })} />} />
            <Row icon="mail" title={t.marketing} hint={t.marketingProfileHint} trailing={<Toggle label={t.marketing} checked={me.consent} onChange={(v) => setting({ consent: v })} />} last />
          </section>
        </div>

        <div>
          <SectionLabel>{t.cafe}</SectionLabel>
          <section className="card space-y-3 p-4 text-[15px]">
            <p className="flex gap-3"><Icon name="pin" size={20} stroke="var(--ink-2)" /> <span>{t.address}<br /><span className="text-[13px] text-ink-2">{t.district}</span></span></p>
            <p className="flex gap-3"><Icon name="clock" size={20} stroke="var(--ink-2)" /> <span>{t.hoursLong[0]}<br />{t.hoursLong[1]}</span></p>
            <p className="flex gap-3"><Icon name="phone" size={20} stroke="var(--ink-2)" /> {CAFE.phone}</p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a href={CAFE.phoneHref} className="btn-line flex items-center justify-center gap-2"><Icon name="phone" size={18} /> {t.call}</a>
              <a href={CAFE.mapsHref} className="btn-line flex items-center justify-center gap-2"><Icon name="pin" size={18} /> {t.map}</a>
            </div>
          </section>
        </div>

        <div>
          <SectionLabel>{t.documents}</SectionLabel>
          <section className="card px-4">
            <Row icon="file" title={lang === "en" ? "Terms" : "Regulamin"} href="/regulamin" />
            <Row icon="file" title={lang === "en" ? "Privacy policy" : "Polityka prywatności"} href="/prywatnosc" last />
          </section>
        </div>

        <div>
          <SectionLabel>{t.account}</SectionLabel>
          <section className="card px-4">
            <Row icon="logout" title={t.signOut} onClick={() => post("/api/guest/logout")} />
            <Row icon="trash" title={t.deleteAccount} onClick={() => setConfirmDelete(true)} danger last />
          </section>
        </div>
      </div>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <SheetTitle>{t.deleteTitle}</SheetTitle>
        <p className="text-[15px] leading-[1.55] text-ink-2">{t.deleteBody(`${me.stamps} / 9`)}</p>
        <button onClick={() => post("/api/guest/delete")} className="min-h-[52px] w-full rounded-xl bg-clay text-[17px] font-semibold text-white">{t.deleteAccount}</button>
        <button onClick={() => setConfirmDelete(false)} className="min-h-11 text-[16px] font-semibold text-gold-ink">{t.keep}</button>
      </Sheet>
    </main>
  );
}
