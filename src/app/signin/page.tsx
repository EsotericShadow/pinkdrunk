import { SignInForm } from "@/components/auth/signin-form";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-10 backdrop-blur">
        <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-white/70">
          Pick up where you left off. Your current session and predictions sync instantly.
        </p>
        <SignInForm />
        <p className="mt-6 text-sm text-white/70">
          New to PinkDrunk? <a href="/signup" className="text-[var(--color-accent)]">Create an account</a>
        </p>
      </div>
    </main>
  );
}
