"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { useT } from "./useT";

const TABS = [
  { href: "/start", icon: "house", label: "Start" },
  { href: "/karta", icon: "qr", label: "Karta" },
  { href: "/menu", icon: "coffee", label: "Menu" },
  { href: "/profil", icon: "user", label: "Profil" },
];

export default function BottomNav() {
  const path = usePathname();
  const { t } = useT();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto grid max-w-[480px] grid-cols-4 border-t border-line bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "var(--shadow-sheet)" }}
    >
      {TABS.map((tab, i) => {
        const on = path.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className="flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2">
            <Icon name={tab.icon} size={24} stroke={on ? "var(--gold)" : "var(--ink-2)"} />
            <span className={`text-[13px] leading-tight ${on ? "font-semibold text-gold-ink" : "font-medium text-ink-2"}`}>{t.tabs[i]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
