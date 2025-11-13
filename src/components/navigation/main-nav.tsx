"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

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
  return (
    <nav className="flex items-center gap-3 text-sm">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
              active
                ? "bg-[var(--color-primary)] text-[var(--color-background)] shadow-[var(--shadow-hard)]"
                : "text-muted hover:text-[var(--color-foreground)]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
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
    </nav>
  );
}
