import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import Link from "next/link";

import ToastProvider from "@/components/ToastProvider";

import "./globals.css";

const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Helpdesk — Support Tickets",
  description: "View, create, and update customer support tickets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <ToastProvider>
          <header className="site-header">
            <div className="container site-header__inner">
              <Link href="/" className="brand" aria-label="Helpdesk home">
                <span className="brand__mark" aria-hidden="true" />
                <span className="brand__name">Helpdesk</span>
              </Link>
              <nav className="site-header__nav">
                <Link href="/">Tickets</Link>
                <Link href="/board">Board</Link>
                <Link href="/tickets/new" className="button button--primary">
                  New ticket
                </Link>
              </nav>
            </div>
          </header>
          <main className="container main">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
