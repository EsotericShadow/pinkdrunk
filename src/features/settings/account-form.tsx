"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AccountFormProps = {
  initialEmail: string;
};

export function AccountForm({ initialEmail }: AccountFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!currentPassword) {
      setMessage("Enter your current password to make changes.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword: newPassword.length > 0 ? newPassword : null,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.error || "Could not update account.");
        return;
      }

      setMessage("Saved");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  };

  return (
    <form
      className="space-y-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <header>
        <h2 className="text-lg font-semibold text-white">Account</h2>
        <p className="text-sm text-white/60">Update your email or password.</p>
      </header>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-white/60">Email</label>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-white/60">Current password</label>
        <Input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-white/60">New password</label>
          <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-white/60">Confirm new password</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message === "Saved" ? "text-emerald-300" : "text-red-300"}`}>{message}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save account"}
        </Button>
      </div>
    </form>
  );
}
