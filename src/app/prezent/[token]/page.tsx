/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { currentGuest } from "@/lib/auth";
import { giftByToken } from "@/lib/loyalty";
import ClaimButton from "./ClaimButton";

export const dynamic = "force-dynamic";

export default async function Prezent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const gift = giftByToken(token);
  const me = await currentGuest();
  const open = gift?.state === "open";
  const own = !!me && gift?.fromGuest === me.id;

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <img src="/img/brand/wall.webp" alt="" className="anim-photo absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--cream) 0%, var(--cream) 45%, rgba(250,242,231,0) 70%)" }} />
      <div className="relative flex flex-1 items-start justify-center pt-[10vh]">
        <img src="/img/brand/cup.png" alt="" className="anim-pop w-[34%] max-w-[170px]" style={{ filter: "drop-shadow(0 8px 16px rgba(60,40,30,.25))" }} />
      </div>
      <div className="relative px-6 pb-[calc(28px+env(safe-area-inset-bottom))] text-center">
        {open ? (
          <>
            <p className="eyebrow">Prezent w Veluré Café</p>
            <h1 className="mt-2 font-serif text-[40px] leading-tight">{gift!.fromName} podarował(a) Ci kawę</h1>
            <p className="mt-3 text-[16px] text-ink-2">Dowolna kawa gratis (bez matchy). Odbierz ją przy kasie: Erazma Ciołka 25, Wola.</p>
            {own ? (
              <p className="mt-6 rounded-xl bg-sand px-4 py-3 text-[15px]">To Twój prezent. Wyślij ten link znajomemu.</p>
            ) : me ? (
              <ClaimButton token={token} />
            ) : (
              <>
                <Link href={`/rejestracja?prezent=${token}`} className="btn-gold mt-6 flex items-center justify-center text-[18px]">Załóż kartę i odbierz</Link>
                <Link href={`/logowanie?prezent=${token}`} className="mt-4 block py-2 text-[16px] font-semibold text-gold-ink">Mam już konto</Link>
              </>
            )}
          </>
        ) : (
          <>
            <h1 className="font-serif text-[36px] leading-tight">Ten prezent jest już nieaktualny</h1>
            <p className="mt-3 text-[16px] text-ink-2">
              {gift?.state === "claimed" ? "Ktoś już go odebrał." : gift?.state === "expired" ? "Link był ważny 30 dni." : "Link został anulowany albo jest błędny."}
            </p>
            <Link href="/" className="btn-gold mt-6 flex items-center justify-center text-[18px]">Przejdź do Veluré</Link>
          </>
        )}
      </div>
    </main>
  );
}
