import Link from "next/link";

export default function Page() {
  return (
    <main className="px-6 pb-10 pt-[calc(24px+env(safe-area-inset-top))]">
      <Link href="/" className="text-[15px] font-semibold text-gold-ink">‹ Wstecz</Link>
      <h1 className="mt-4 font-serif text-[40px]">Polityka prywatności</h1>
      <p className="mt-4 text-[16px] text-ink-2">Dokument w przygotowaniu. Pełna treść pojawi się przed publicznym startem programu.</p>
    </main>
  );
}
