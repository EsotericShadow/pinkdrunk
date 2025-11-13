"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { LogoutButton } from "@/components/navigation/logout-button";

const links = [
  { href: "/today", label: "Tonight" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function MainNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const linkStyles = (active: boolean) =>
    `rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
      active
        ? "bg-[var(--color-primary)] text-[var(--color-background)] shadow-[var(--shadow-hard)]"
        : "text-muted hover:text-[var(--color-foreground)]"
    }`;

  return (
    <nav className="relative text-sm">
      <div className="hidden items-center gap-3 md:flex">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={linkStyles(active)}>
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/today"
          className="rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-background)] shadow-[var(--shadow-hard)] transition hover:scale-[1.02]"
        >
          Start
        </Link>
        {isAuthenticated ? (
          <LogoutButton />
        ) : (
          <Link
            href="/signin"
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted hover:text-[var(--color-foreground)]"
          >
            Sign in
          </Link>
        )}
      </div>

      <div className="flex items-center md:hidden">
        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-muted transition hover:text-[var(--color-foreground)]"
        >
          Menu
          <span className="relative block h-3 w-4">
            <span
              className={`absolute inset-x-0 top-0 h-0.5 rounded-full bg-current transition ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`}
            />
            <span
              className={`absolute inset-x-0 top-1.5 h-0.5 rounded-full bg-current transition ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-current transition ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
            />
          </span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 rounded-2xl border border-white/10 bg-[var(--color-surface)]/95 p-4 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-2">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${linkStyles(active)} w-full text-center`}
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-1">
                <Link
                  href="/today"
                  onClick={closeMenu}
                  className="block rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-background)] shadow-[var(--shadow-hard)] transition hover:scale-[1.02]"
                >
                  Start
                </Link>
              </div>
              <div className="pt-2" onClick={isAuthenticated ? closeMenu : undefined}>
                {isAuthenticated ? (
                  <LogoutButton />
                ) : (
                  <Link
                    href="/signin"
                    onClick={closeMenu}
                    className="block rounded-full border border-white/15 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted hover:text-[var(--color-foreground)]"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
