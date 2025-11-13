"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/signin" });
    });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isPending}>
      {isPending ? "Logging out" : "Log out"}
    </Button>
  );
}
