"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof formSchema>;

function InnerSignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: search.get("email") ?? "",
      password: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      setServerError(null);
      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        setServerError("Could not sign in. Check your email and password.");
        return;
      }

      router.replace("/today");
    });
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-white">
          Email
        </label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-red-300">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-white">
          Password
        </label>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
        {errors.password && <p className="text-sm text-red-300">{errors.password.message}</p>}
      </div>
      {serverError && (
        <p className="rounded-md border border-red-400 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {serverError}
        </p>
      )}
      <Button type="submit" disabled={isPending} className="w-full">
        Sign in
      </Button>
    </form>
  );
}

export function SignInForm() {
  return (
    <Suspense fallback={<div className="mt-6 text-sm text-white/60">Loading…</div>}>
      <InnerSignInForm />
    </Suspense>
  );
}
