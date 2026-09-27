import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Veluré — Kasa",
  manifest: "/kasa.webmanifest",
  appleWebApp: { capable: true, title: "Veluré Kasa", statusBarStyle: "default" },
};

export default function KasaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
