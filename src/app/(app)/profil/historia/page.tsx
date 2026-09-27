"use client";
import Link from "next/link";
import { useMe } from "@/components/useMe";
import { useT } from "@/components/useT";
import { ddmm, hhmm, pieczatki, kawy } from "@/lib/pl";

export default function Historia() {
  const { me } = useMe();
  const { t, lang } = useT();
  return (
    <main className="px-5 pt-[calc(20px+env(safe-area-inset-top))]">
      <Link href="/profil" className="text-[15px] font-semibold text-gold-ink">‹ {t.profileTitle}</Link>
      <h1 className="mt-2 font-serif text-[28px] leading-[1.2]">{t.historyTitle}</h1>
      <section className="card mt-4 divide-y divide-line">
        {!me ? (
          <p className="p-5 text-ink-2">{t.loading}</p>
        ) : (
          me.history.map((h) => (
            <div key={h.id} className="flex gap-4 px-5 py-4">
              <div className="w-14 shrink-0 text-[15px] text-ink-2">
                {ddmm(h.created_at)}
                <br />
                <span className="text-[13px]">{hhmm(h.created_at)}</span>
              </div>
              <div className="flex-1">
                {h.kind === "signup" && (
                  <>
                    <p className="text-[16px]">{t.cardCreated}</p>
                    <p className="text-[14px] text-ink-2">{t.firstStamp}</p>
                  </>
                )}
                {h.kind === "stamp" && (
                  <>
                    <p className="text-[16px]">
                      {lang === "en" ? `${h.count} ${h.count === 1 ? "coffee" : "coffees"} · +${h.count} ${h.count === 1 ? "stamp" : "stamps"}` : `${h.count} ${kawy(h.count)} · +${h.count} ${pieczatki(h.count)}`}
                    </p>
                    <p className="text-[14px] text-ink-2">{t.cardState} {h.stamps_after} / 9</p>
                  </>
                )}
                {h.kind === "redeem" && (
                  <>
                    <p className="text-[16px]">{t.rewardTitles[h.reward_type ?? ""] ?? "—"}</p>
                    <p className="text-[14px] font-semibold text-gold-ink">{t.rewardCollected}</p>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
