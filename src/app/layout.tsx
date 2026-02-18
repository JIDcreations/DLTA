import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import AppBootstrap from "@/components/AppBootstrap";
import PurchaseModal from "@/components/Modals/PurchaseModal";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DLTA — Crypto Portfolio Tracker",
  description: "Track crypto purchases, live prices, and performance with a premium offline-ready dashboard.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${mono.variable}`}>
        <div className="app-shell">
          <AppBootstrap />
          <AppHeader />
          <main className="app-main">{children}</main>
          <PurchaseModal />
        </div>
      </body>
    </html>
  );
}
