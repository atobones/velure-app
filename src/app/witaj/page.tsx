/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentGuest } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { DICT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Witaj() {
  if (await currentGuest()) redirect("/start");
  // Default to the phone language
  const saved = (await cookies()).get("lang")?.value;
  const lang = saved === "en" || saved === "pl" ? saved : (await headers()).get("accept-language")?.toLowerCase().startsWith("en") ? "en" : "pl";
  const t = DICT[lang];
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <img src="/img/brand/wall.webp" alt="" className="anim-photo absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--cream) 0%, var(--cream) 38%, rgba(250,242,231,0) 62%)" }} />
      <div className="relative flex flex-1 items-start justify-center pt-[14vh]">
        <img
          src="/img/brand/logo-round.png"
          alt="Veluré Café"
          className="anim-up w-[46%] max-w-[220px] rounded-full"
          style={{ animationDelay: "300ms", filter: "drop-shadow(0 6px 14px rgba(60,40,30,.28))" }}
        />
      </div>
      <div className="relative px-6 pb-[calc(28px+env(safe-area-inset-bottom))] text-center">
        <h1 className="anim-up font-serif text-[40px] leading-[1.12]" style={{ animationDelay: "700ms" }}>
          {t.welcomeTitle}
        </h1>
        <p className="anim-up mt-3 text-[17px] leading-snug text-ink-2" style={{ animationDelay: "780ms" }}>
          {t.welcomeBody1}
          <br />
          {t.welcomeBody2}
        </p>
        <Link href="/rejestracja" className="btn-gold anim-up mt-6 flex items-center justify-center text-[18px]" style={{ animationDelay: "860ms" }}>
          {t.welcomeCta}
        </Link>
        <Link href="/logowanie" className="anim-up mt-4 block py-2 text-[16px] font-semibold text-gold-ink" style={{ animationDelay: "940ms" }}>
          {t.welcomeAlt}
        </Link>
      </div>
    </main>
  );
}
