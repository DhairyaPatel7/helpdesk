import type { Metadata } from "next";
import Link from "next/link";

import ToastProvider from "@/components/ToastProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Support Ticket Dashboard",
  description: "View, create, and update customer support tickets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <header className="site-header">
            <div className="container site-header__inner">
              <Link href="/" className="site-header__brand">
                Support Tickets
              </Link>
              <nav className="site-header__nav">
                <Link href="/">All tickets</Link>
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
