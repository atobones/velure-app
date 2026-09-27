"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { MENU } from "@/lib/menu";
import { useT } from "@/components/useT";

export default function Menu() {
  const [active, setActive] = useState(MENU[0].id);
  const { t, lang } = useT();
  const en = lang === "en";
  const chipsRef = useRef<HTMLDivElement>(null);
  const lock = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (lock.current) return;
      let current = MENU[0].id;
      for (const s of MENU) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < 160) current = s.id;
      }
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = MENU[MENU.length - 1].id;
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    if (location.hash) setTimeout(() => go(location.hash.slice(1)), 50);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    chipsRef.current?.querySelector(`[data-id="${active}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  function go(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    lock.current = true;
    setActive(id);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 128, behavior: "smooth" });
    setTimeout(() => (lock.current = false), 700);
  }

  return (
    <main>
      <div className="sticky top-0 z-20 bg-cream/95 pt-[calc(16px+env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-3 px-5">
          <img src="/img/brand/monogram.png" alt="" width={26} height={26} />
          <h1 className="font-serif text-[28px] leading-[1.2]">{t.menuTitle}</h1>
        </div>
        <div ref={chipsRef} className="no-scrollbar mt-3 flex gap-2 overflow-x-auto border-b border-line px-5 pb-3">
          {MENU.map((s) => (
            <button
              key={s.id}
              data-id={s.id}
              onClick={() => go(s.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[15px] font-semibold ${active === s.id ? "bg-gold text-ink" : "bg-sand text-ink-2"}`}
            >
              {en ? s.titleEn : s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5">
        {MENU.map((s) => (
          <section key={s.id} id={s.id} className="pt-6">
            {s.hero && <img src={`/img/menu/${s.hero}-hero.webp`} alt="" className="mb-4 aspect-[3/2] w-full rounded-[28px] object-cover" loading="lazy" />}
            <h2 className="font-serif text-[28px] leading-[1.2]">{en ? s.titleEn : s.title}</h2>
            {s.note && <p className="mb-3 text-[15px] text-ink-2">{en ? s.noteEn : s.note}</p>}
            {s.combo && (
              <div className="my-3 rounded-2xl border border-[var(--line-accent)] bg-[var(--gold-12)] px-5 py-4">
                <p className="eyebrow">{t.set}</p>
                <p className="mt-1 text-[16px] font-medium">{en ? s.comboEn : s.combo}</p>
              </div>
            )}
            {s.groups.map((g, gi) => (
              <div key={gi} className="card mt-3 px-5 py-2">
                {g.title && <p className="eyebrow pt-3">{en ? g.titleEn : g.title}</p>}
                {g.note && <p className="text-[14px] text-ink-2">{en ? g.noteEn : g.note}</p>}
                <ul className="divide-y divide-line">
                  {g.items.map((it) => (
                    <li key={it.name} className="flex gap-4 py-4">
                      {it.photo && <img src={`/img/menu/${it.photo}.webp`} alt="" className="h-[88px] w-[88px] shrink-0 rounded-2xl object-cover" loading="lazy" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[17px] font-medium">{it.name}</p>
                          <p className="shrink-0 text-[17px] font-semibold text-gold-ink">{it.price} zł</p>
                        </div>
                        {it.desc && <p className="mt-1 text-[14px] leading-snug text-ink-2">{en ? it.descEn ?? it.desc : it.desc}</p>}
                        {it.featured && <span className="mt-2 inline-block rounded-full border border-[var(--line-accent)] bg-[var(--gold-12)] px-3 py-1 text-[13px] font-semibold text-gold-ink">☆ {t.featured}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {s.extras && (
              <div className="mt-3 rounded-2xl bg-sand px-5 py-4">
                <p className="eyebrow mb-2">{en ? s.extras.titleEn : s.extras.title}</p>
                {s.extras.items.map((x) => (
                  <div key={x.name} className="flex justify-between py-1 text-[16px]">
                    <span>{x.name}</span>
                    <span className="font-semibold text-gold-ink">+{x.price} zł</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
        <div className="h-8" />
      </div>
    </main>
  );
}
