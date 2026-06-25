"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./AuthProvider";

const PUBLIC_PATHS = ["/login", "/register"];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, initializing, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (initializing) return;
    if (!user && !isPublic) {
      router.replace("/login");
    } else if (user && isPublic) {
      router.replace("/");
    }
  }, [initializing, user, isPublic, router]);

  const loader = (
    <div className="app-loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
    </div>
  );

  if (initializing) return loader;

  if (!user) {
    return isPublic ? <main className="auth-main">{children}</main> : loader;
  }

  if (isPublic) return loader;

  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link href="/" className="brand" aria-label="Helpdesk home">
            <span className="brand__mark" aria-hidden="true" />
            <span className="brand__name">Helpdesk</span>
          </Link>
          <nav className="site-header__nav">
            <Link href="/">Tickets</Link>
            <Link href="/board">Board</Link>
            <span className="site-header__divider" aria-hidden="true" />
            <span className="site-header__user" title={user.email}>
              {user.email}
            </span>
            <button type="button" className="button button--ghost" onClick={logout}>
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="container main">{children}</main>
    </>
  );
}
