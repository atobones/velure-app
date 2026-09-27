import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/SwRegister";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Veluré Café",
  description: "Karta stałego gościa Veluré Café",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Veluré", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#faf2e7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={`${inter.variable} ${cormorant.variable} antialiased`}>
        <div className="app-wrap mx-auto min-h-dvh max-w-[480px] bg-cream">{children}</div>
        <SwRegister />
      </body>
    </html>
  );
}
