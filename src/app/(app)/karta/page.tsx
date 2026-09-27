"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StampGrid from "@/components/StampGrid";
import Counter from "@/components/Counter";
import Icon from "@/components/Icon";
import { ActionCard, CouponCard, NoticeCard, RewardStep, SectionLabel, Sheet, SheetTitle } from "@/components/ui";
import { useMe } from "@/components/useMe";
import { useT } from "@/components/useT";
import { ddmm, formatCard, pieczatki, toDate } from "@/lib/pl";

export default function Karta() {
  const { me, change, clearChange, reload } = useMe(3000);
  const { t, lang } = useT();
  const router = useRouter();
  const [big, setBig] = useState(false);
  const [rules, setRules] = useState(false);
  const [help, setHelp] = useState(false);
  const [giftMsg, setGiftMsg] = useState("");
  const [welcomeGift, setWelcomeGift] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("prezent")) setWelcomeGift(true);
  }, []);

  useEffect(() => {
    if (!change) return;
    navigator.vibrate?.(60);
    const tm = setTimeout(clearChange, 4000);
    return () => clearTimeout(tm);
  }, [change, clearChange]);

  if (!me) return <main className="p-6 text-ink-2">{t.loading}</main>;

  const nextLine = lang === "en" ? nextLineEn(me.stamps) : me.nextLine;
  const coffeeReward = me.rewards.find((r) => r.giftable);

  async function share(text: string, url: string) {
    try {
      if (navigator.share) await navigator.share({ text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setGiftMsg(t.giftCopied);
      }
    } catch {
      /* share sheet dismissed */
    }
  }

  async function gift(rewardId: number) {
    setGiftMsg("");
    const r = await fetch("/api/guest/gift", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rewardId }) });
    const j = await r.json();
    if (!r.ok) return setGiftMsg(j.error);
    await share(t.giftShareText(j.from), j.url);
    reload();
  }

  async function cancelGift(giftId: number) {
    await fetch("/api/guest/gift/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ giftId }) });
    reload();
  }

  async function dismissClaim() {
    await fetch("/api/guest/claim/seen", { method: "POST" });
    reload();
  }

  const couponType = (type: string, giftFrom?: boolean) => (giftFrom ? t.couponTypeGift : type === "birthday" ? t.couponTypeBirthday : t.couponTypeReward);
  const couponIcon = (type: string) => ({ addon3: "cup-soda", dessert6: "percent", coffee9: "coffee", birthday: "cake" })[type] ?? "gift";

  return (
    <main className="px-5 pt-[calc(16px+env(safe-area-inset-top))]">
      <h1 className="pb-4 pt-1 font-serif text-[28px] leading-[1.2]">{t.cardTitle}</h1>

      {change && (
        <div className="anim-pop fixed inset-x-0 top-[calc(16px+env(safe-area-inset-top))] z-40 mx-auto w-[88%] max-w-[420px] rounded-2xl bg-dark px-5 py-4 text-center text-[18px] font-semibold text-gold shadow-lg">
          {lang === "en" ? t.toastStamps(change.added, "") : `+${change.added} ${pieczatki(change.added)}`} · {me.stamps} / 9
        </div>
      )}

      <div className="flex flex-col gap-4 pb-6">
        <section className="flex flex-col items-center gap-3 overflow-hidden rounded-[28px] border border-line bg-white p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="rounded-2xl bg-white p-4">
            <div className="w-[240px] max-w-full" dangerouslySetInnerHTML={{ __html: me.qr }} />
          </div>
          <button onClick={() => setBig(true)} className="min-h-11 px-2 text-[22px] font-semibold tracking-[0.16em]" style={{ fontVariantNumeric: "lining-nums tabular-nums" }}>
            {formatCard(me.cardNumber)}
          </button>
          <p className="text-center text-[13px] leading-[1.45] text-ink-2">{t.codeHint}</p>
          <button onClick={() => setHelp(true)} className="min-h-11 px-2 text-[14px] font-medium text-gold-ink underline underline-offset-[3px]">
            {t.codeFailed}
          </button>
        </section>

        {me.claim && (
          <NoticeCard
            icon={me.claim.status === "pending" ? "clock" : me.claim.status === "added" ? "check-circle" : "search"}
            tone={me.claim.status === "added" ? "success" : "sand"}
            title={me.claim.status === "pending" ? t.claimPendingTitle(ddmm(me.claim.createdAt)) : me.claim.status === "added" ? t.claimAddedTitle : t.claimRejectedTitle}
            body={me.claim.status === "pending" ? t.claimStatusPending : me.claim.status === "added" ? t.claimStatusAdded : t.claimRejectedBody}
          >
            {me.claim.status === "rejected" && (
              <a href="tel:+48575602489" className="mt-1 inline-block min-h-11 text-[14px] font-medium text-gold-ink underline underline-offset-[3px]">{t.claimRejectedAction}</a>
            )}
            {me.claim.status !== "pending" && (
              <button onClick={dismissClaim} className="mt-1 block text-[14px] font-medium text-gold-ink">{t.ok}</button>
            )}
          </NoticeCard>
        )}

        <div>
          <SectionLabel>{t.stamps}</SectionLabel>
          <div className="card flex flex-col gap-2 p-4">
            <StampGrid stamps={me.stamps} />
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <Counter value={me.stamps} size={17} />
              <span className="min-w-0 text-right text-[14px] leading-[1.4] text-ink-2">{nextLine}</span>
            </div>
            <button onClick={() => setRules(true)} className="min-h-11 self-start px-0.5 text-[14px] font-medium text-gold-ink underline underline-offset-[3px]">
              {t.howTitle}
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {me.week.resetRecently && <NoticeCard icon="clock" tone="error" title={t.resetTitle} body={t.resetBody} />}
            {me.week.savedThisMonth && <NoticeCard icon="check-circle" tone="rose" title={t.saveTitle} body={t.saveBody} />}
            {me.week.mondayWarning && <NoticeCard icon="alert" tone="sand" title={t.warnTitle} body={t.warnBody} />}
          </div>
        </div>

        <div>
          <SectionLabel>{t.rewardsTitle}</SectionLabel>
          <div className="card p-[18px]">
            {t.rewards.map((r, i) => (
              <RewardStep
                key={r.n}
                n={r.n}
                title={r.t}
                desc={r.d}
                icon={r.i}
                state={me.stamps >= r.n || (r.n === 9 && !!coffeeReward) ? "earned" : t.rewards.find((x) => x.n > me.stamps)?.n === r.n ? "current" : "locked"}
                last={i === t.rewards.length - 1}
                actionLabel={r.n === 9 && coffeeReward ? t.giftReward : undefined}
                onAction={coffeeReward ? () => gift(coffeeReward.id) : undefined}
              />
            ))}
          </div>
          {giftMsg && <p className="mt-2 rounded-xl bg-sand px-4 py-3 text-[14px]">{giftMsg}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>{t.couponsTitle}</SectionLabel>
          {me.rewards.length === 0 ? (
            <p className="rounded-2xl bg-sand px-4 py-4 text-[14px] text-ink-2">{t.noCoupons}</p>
          ) : (
            me.rewards.map((r) => (
              <CouponCard
                key={r.id}
                type={couponType(r.type, !!r.giftFrom)}
                title={t.rewardTitles[r.type] ?? r.title}
                meta={r.giftFrom ? t.giftFrom(r.giftFrom) : t.couponAt}
                icon={couponIcon(r.type)}
                actionLabel={t.showCode}
                onAction={() => setBig(true)}
              />
            ))
          )}
        </div>

        {me.gifts.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel>{t.giftsSent}</SectionLabel>
            {me.gifts.map((g) => (
              <div key={g.id} className="card p-4">
                <p className="text-[15px] font-semibold">{t.giftPending}</p>
                <p className="mt-0.5 text-[13px] text-ink-2">{t.giftPendingBody}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button onClick={() => share(t.giftShareText(me.name.split(" ")[0]), `${location.origin}/prezent/${g.token}`)} className="btn-line text-[14px]">{t.resendGift}</button>
                  <button onClick={() => cancelGift(g.id)} className="btn-line text-[14px] text-terra">{t.cancelGift}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {me.used.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel>{t.usedTitle}</SectionLabel>
            {me.used.map((u, i) => (
              <CouponCard key={i} used type={couponType(u.type, !!u.gift_from)} title={t.rewardTitles[u.type] ?? u.type} meta={`${t.usedOn} ${toDate(u.redeemed_at).toLocaleDateString(lang === "en" ? "en-GB" : "pl-PL", { timeZone: "Europe/Warsaw" })}`} icon={couponIcon(u.type)} />
            ))}
          </div>
        )}

        <ActionCard icon="cake" title={t.birthdayTitle} body={t.birthdayCardBody} onClick={() => router.push("/profil#urodziny")} />
        {me.referralCode && (
          <ActionCard icon="user-plus" title={t.bringTitle} body={t.bringBody} onClick={() => share(t.bringShare, `${location.origin}/polecenie/${me.referralCode}`)} />
        )}
      </div>

      <Sheet open={rules} onClose={() => setRules(false)}>
        <SheetTitle>{t.howTitle}</SheetTitle>
        {[t.streakRule, t.expiryRule, t.saveBody].map((line) => (
          <p key={line} className="text-[15px] leading-[1.55] text-ink-2">{line}</p>
        ))}
        <button onClick={() => setRules(false)} className="btn-line w-full">{t.close}</button>
      </Sheet>

      <ClaimSheet open={help} onClose={() => setHelp(false)} onSent={reload} />

      {big && (
        <button onClick={() => setBig(false)} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white px-6">
          <div className="w-[260px]" dangerouslySetInnerHTML={{ __html: me.qr }} />
          <span className="text-[40px] font-semibold tracking-[0.12em]" style={{ fontVariantNumeric: "lining-nums tabular-nums" }}>{formatCard(me.cardNumber)}</span>
          <span className="text-[15px] text-ink-2">{t.numberHint}</span>
          <span className="text-[13px] text-ink-2">{t.tapToClose}</span>
        </button>
      )}

      <Sheet open={welcomeGift} onClose={() => setWelcomeGift(false)}>
        <SheetTitle>{t.giftWelcomeTitle}</SheetTitle>
        <p className="text-[15px] leading-[1.55] text-ink-2">{t.giftWelcomeBody}</p>
        <button onClick={() => setWelcomeGift(false)} className="btn-gold">{t.great}</button>
      </Sheet>
    </main>
  );
}

function nextLineEn(stamps: number) {
  if (stamps < 3) return `${3 - stamps} more to a free coffee add-on`;
  if (stamps < 6) return `${6 - stamps} more to 50% off a dessert`;
  if (stamps < 9) return `${9 - stamps} more to a free coffee`;
  return "Your free coffee is waiting";
}

function ClaimSheet({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: () => void }) {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [when, setWhen] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"form" | "sending" | "sent">("form");
  const [err, setErr] = useState("");
  const cam = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setWhen(now);
    setFile(null);
    setPreview("");
    setComment("");
    setErr("");
    setState("form");
  }, [open]);

  function pick(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function send() {
    if (!file) return;
    setState("sending");
    setErr("");
    const fd = new FormData();
    fd.append("photo", file);
    fd.append("purchasedAt", when.replace("T", " "));
    fd.append("comment", comment);
    const r = await fetch("/api/guest/claim", { method: "POST", body: fd }).catch(() => null);
    if (!r || !r.ok) {
      setState("form");
      return setErr(r ? (await r.json()).error : t.claimErrorTitle);
    }
    setState("sent");
    onSent();
  }

  return (
    <Sheet open={open} onClose={onClose}>
      {state === "sent" ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center self-center rounded-full bg-[var(--gold-12)]">
            <Icon name="check" size={26} stroke="var(--gold)" />
          </div>
          <SheetTitle>{t.claimDoneTitle}</SheetTitle>
          <p className="text-[15px] leading-[1.55] text-ink-2">{t.claimDoneBody}</p>
          <button onClick={onClose} className="btn-line w-full">{t.close}</button>
        </>
      ) : (
        <>
          <SheetTitle>{t.claimTitle}</SheetTitle>
          {err && (
            <div className="flex items-start gap-2 rounded-xl bg-[rgba(176,112,95,.14)] p-3">
              <Icon name="alert" size={18} stroke="var(--clay)" />
              <p className="text-[14px]">{err}</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-medium text-ink-2">{t.claimReceipt}</span>
            {file ? (
              <div className="flex items-center gap-3">
                <img src={preview} alt="" className="h-20 w-20 flex-none rounded-2xl object-cover" />
                <div>
                  <p className="flex items-center gap-1.5 text-[15px] font-semibold"><Icon name="check-circle" size={18} stroke="var(--green)" /> {t.claimPhotoReady}</p>
                  <button onClick={() => cam.current?.click()} className="mt-1 min-h-11 text-[14px] font-medium text-gold-ink underline underline-offset-[3px]">{t.claimRetake}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => cam.current?.click()} className="btn-line flex items-center justify-center gap-2">
                <Icon name="camera" size={20} /> {t.claimCamera}
              </button>
            )}
            <input ref={cam} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            <span className="text-[13px] text-ink-2">{t.claimReceiptHint}</span>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[14px] font-medium text-ink-2">{t.claimWhen}</span>
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="min-h-12 rounded-xl border border-line bg-white px-3 text-[16px]" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[14px] font-medium text-ink-2">{t.claimComment}</span>
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.claimCommentPlaceholder} className="min-h-12 rounded-xl border border-line bg-white px-3 text-[16px]" />
          </label>
          <button disabled={!file || state === "sending"} onClick={send} className="btn-gold">{state === "sending" ? t.claimSending : t.claimSend}</button>
          <button onClick={onClose} className="min-h-11 text-[15px] font-semibold text-gold-ink">{t.close}</button>
        </>
      )}
    </Sheet>
  );
}
