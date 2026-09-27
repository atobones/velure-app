/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { useT } from "@/components/useT";
import StampGrid from "@/components/StampGrid";

export default function PierwszaPieczatka() {
  const { t, lang } = useT();
  return (
    <main className="flex min-h-dvh flex-col px-6 pb-[calc(28px+env(safe-area-inset-bottom))] pt-[calc(28px+env(safe-area-inset-top))] text-center">
      <img src="/img/brand/bean.png" alt="" width={72} height={72} className="anim-pop mx-auto" />
      <h1 className="anim-up mt-4 font-serif text-[34px] leading-tight">{t.firstStampTitle}</h1>
      <p className="anim-up mt-2 text-[16px] text-ink-2" style={{ animationDelay: "150ms" }}>
        {t.firstStampBody}
      </p>
      <div className="card anim-up mt-6 p-4" style={{ animationDelay: "300ms" }}>
        <StampGrid stamps={1} size={46} />
        <p className="mt-4 text-left text-[15px] text-ink-2">1 / 9 · {lang === "en" ? "2 more to a free coffee add-on" : "Jeszcze 2 do dodatku do kawy gratis"}</p>
      </div>
      <div className="flex-1" />
      <Link href="/karta" className="btn-gold mt-6 flex items-center justify-center text-[18px]">{t.showMyCard}</Link>
    </main>
  );
}
