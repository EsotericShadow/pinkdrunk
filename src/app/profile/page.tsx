import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
import { getRequiredProfile } from "@/lib/profile";

export default async function ProfilePage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  let profile; 
  try {
    profile = await getRequiredProfile(session.user.id);
  } catch {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold text-white">Profile</h1>
        <p className="mt-2 text-sm text-white/70">Complete onboarding to see your profile summary.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-white">Profile</h1>
      <p className="mt-2 text-sm text-white/70">Manage your physiology details and PinkDrunk preferences.</p>

      <section className="mt-6 space-y-2 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur">
        <Detail label="Name" value={profile.name} />
        <Detail label="Location" value={profile.geoLocation || "Not set"} />
        <Detail label="Cycle tracking" value={profile.menstruation ? "Enabled" : "Disabled"} />
        <Detail label="Metabolism" value={profile.metabolismScore.toString()} />
        <Detail label="Tolerance" value={profile.toleranceScore.toString()} />
        <Detail label="PinkDrunk target" value={profile.pinkdrunkTargetUser.toString()} />
        <Detail label="BMI" value={formatBmi(profile.bmi)} />
        <Detail label="Total body water" value={formatTbw(profile.totalBodyWaterL)} />
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-white/80">
      <span className="text-white/60">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formatBmi(value: number | null) {
  if (!value) {
    return "Calibrating";
  }
  return value.toFixed(1);
}

function formatTbw(value: number | null) {
  if (!value) {
    return "Calibrating";
  }
  return `${value.toFixed(1)} L`;
}
