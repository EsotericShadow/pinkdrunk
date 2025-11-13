import type { Metadata } from "next";
import { ReactNode } from "react";
import { Montserrat, Space_Grotesk, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { Providers } from "@/components/providers";
import { MainNav } from "@/components/navigation/main-nav";

const montserrat = Montserrat({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const heroDisplay = Space_Grotesk({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-hero-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PinkDrunk",
  description:
    "PinkDrunk keeps your session in the perfect pink zone with a smart prediction engine.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${jetBrainsMono.variable} ${heroDisplay.variable} antialiased bg-[var(--color-background)] text-[var(--color-foreground)]`}
      >
        <Providers>
          <div className="min-h-screen">
            <header className="sticky top-0 z-20 border-b border-white/5 bg-[rgba(7,8,15,0.9)] backdrop-blur-xl">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="heading text-3xl text-[var(--color-primary)]">PINKDRUNK</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">Plan smarter nights.</p>
                </div>
                <MainNav />
              </div>
            </header>
            <div className="mx-auto min-h-screen max-w-6xl px-6 py-12 md:px-10">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
