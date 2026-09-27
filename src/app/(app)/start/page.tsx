"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import StampGrid from "@/components/StampGrid";
import Counter from "@/components/Counter";
import Icon from "@/components/Icon";
import { useMe } from "@/components/useMe";
import { CAFE } from "@/lib/menu";
import { useT } from "@/components/useT";
import { greetingKey } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { ComboCard, PromoCard, PromoRow } from "@/components/Promo";

type Content = {
  news: { id: number; title: string; description: string | null; price: number | null; endsOn: string; photo: string }[];
  combos: { id: number; title: string; image: string | null; oldPrice: number; price: number; window: string }[];
};

export default function Start() {
  const { me } = useMe(5000);
  const first = me?.name.split(" ")[0] ?? "";
  const { t, lang } = useT();
  const hour = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Warsaw" }));
  const next = me ? (lang === "en" ? nextLineEn(me.stamps) : me.nextLine) : "";
  const [content, setContent] = useState<Content>({ news: [], combos: [] });
  useEffect(() => {
    fetch(`/api/content?lang=${lang}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setContent(j))
      .catch(() => {});
  }, [lang]);
  const until = (iso: string) => `${lang === "en" ? "Until" : "Do"} ${iso.split("-").reverse().slice(0, 2).join(".")}`;
  return (
    <main>
      <div className="relative h-[210px]">
        <img src="/img/brand/seating.webp" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--cream) 0%, rgba(250,242,231,.55) 45%, rgba(250,242,231,0) 80%)" }} />
        <div className="absolute inset-x-0 bottom-2 flex items-center gap-3 px-6">
          <img src="/img/brand/monogram.png" alt="" width={26} height={26} />
          <h1 className="flex-1 font-serif text-[28px] leading-[1.2]">
            {t[greetingKey(hour)]}
            {first && `, ${first}`}
          </h1>
        </div>
      </div>

      <div className="space-y-5 px-5 pt-4">
        <Link href="/karta" className="flex flex-col gap-5 rounded-[28px] bg-dark p-5 text-cream">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[rgba(250,242,231,.66)]">{t.stamps}</p>
              <div className="mt-1.5"><Counter value={me?.stamps ?? "–"} size={40} dark color="var(--gold)" /></div>
            </div>
            <img src="/img/brand/monogram.png" alt="" width={38} height={38} />
          </div>
          {me && <StampGrid stamps={me.stamps} dark />}
          <p className="text-[14px] leading-[1.45] text-[rgba(250,242,231,.8)]">{next}</p>
        </Link>

        {me && me.rewards.length > 0 && (
          <Link href="/karta" className="flex items-center gap-3 rounded-2xl border border-gold bg-white px-5 py-4">
            <Icon name="gift" stroke="var(--gold)" />
            <span className="text-[16px] font-semibold">{t.rewardTitles[me.rewards[0].type] ?? me.rewards[0].title} {t.rewardWaiting}</span>
          </Link>
        )}

        <div className="flex items-start gap-3 rounded-2xl bg-sand-2 p-4 text-[14px] leading-[1.5]">
          <Icon name="baby" />
          {t.kids}
        </div>

        <PromoRow title={lang === "en" ? "New" : "Nowości"} count={content.news.length}>
          {content.news.map((n) => (
            <PromoCard key={n.id} title={n.title} description={n.description} image={n.photo} until={until(n.endsOn)} price={n.price ? `${n.price} zł` : null} badge={lang === "en" ? "New" : "Nowość"} width={content.news.length > 1 ? 280 : undefined} />
          ))}
        </PromoRow>

        <section className="flex flex-col gap-3">
          <h2 className="text-[20px] font-semibold leading-[1.3]">{t.sets}</h2>
          <Link href="/menu#sniadania" className="card block overflow-hidden">
            <img src="/img/menu/english-breakfast-hero.webp" alt="" className="aspect-[3/2] w-full object-cover" />
            <div className="p-5">
              <p className="text-[19px] font-semibold">{t.comboTitle}</p>
              <p className="mt-1 text-[15px] text-ink-2">{t.comboBody}</p>
              <p className="mt-2 text-[24px] font-semibold text-gold-ink">+9 zł</p>
            </div>
          </Link>
          {content.combos.map((c) => (
            <ComboCard key={c.id} title={c.title} oldPrice={`${c.oldPrice} zł`} newPrice={`${c.price} zł`} window={c.window} image={c.image ?? undefined} href="/menu" />
          ))}
        </section>

        <div className="flex flex-wrap gap-2 pb-2 text-[14px] font-medium">
          <span className="flex items-center gap-2 rounded-full bg-sand px-3.5 py-2"><Icon name="clock" size={18} /> {t.hoursShort}</span>
          <a href={CAFE.mapsHref} className="flex items-center gap-2 rounded-full bg-sand px-4 py-2"><Icon name="pin" size={18} /> {t.address}</a>
          <a href={CAFE.phoneHref} className="flex items-center gap-2 rounded-full bg-sand px-4 py-2"><Icon name="phone" size={18} /> {CAFE.phone}</a>
        </div>
      </div>
    </main>
  );
}

function nextLineEn(stamps: number) {
  if (stamps < 3) return `${3 - stamps} more to a free coffee add-on`;
  if (stamps < 6) return `${6 - stamps} more to 50% off a dessert`;
  if (stamps < 9) return `${9 - stamps} more to a free coffee`;
  return "Your free coffee is waiting";
}
