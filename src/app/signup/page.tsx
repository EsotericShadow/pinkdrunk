"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Include letters and numbers"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      setServerError(null);

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        if (response.status === 409) {
          setServerError("You already have an account. Try signing in instead.");
        } else {
          setServerError("We couldn’t create your account. Try again.");
        }
        return;
      }

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError(result.error);
        return;
      }

      router.replace("/onboarding");
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-10 backdrop-blur">
        <h1 className="text-3xl font-semibold text-white">Sign up</h1>
        <p className="mt-2 text-sm text-white/70">
          Step 1 of onboarding — set up your login. You’ll add body stats and your PinkDrunk target next.
        </p>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-white">
              Email
            </label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-300">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-white">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            <p className="text-xs text-white/60">
              Minimum 8 characters with at least one letter and one number.
            </p>
            {errors.password && (
              <p className="text-sm text-red-300">{errors.password.message}</p>
            )}
          </div>
          {serverError && (
            <p className="rounded-md border border-red-400 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {serverError}
            </p>
          )}
          <Button type="submit" disabled={isPending} className={cn("w-full", isPending && "animate-pulse")}>Create account</Button>
        </form>
        <p className="mt-6 text-sm text-white/70">
          Already pink? <a href="/signin" className="text-[var(--color-accent)]">Sign in</a>
        </p>
      </div>
    </main>
  );
}
