import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { getRequiredProfile } from "@/lib/profile";
import { getOrCreateUserSettings } from "@/lib/settings";
import type { OnboardingFormValues } from "@/features/onboarding/schema";
import { ProfileForm } from "@/features/settings/profile-form";
import { AccountForm } from "@/features/settings/account-form";
import { SettingsForm } from "@/features/settings/settings-form";
import { InfoBanner } from "@/components/ui/info-banner";
import type { UnitSystem } from "@prisma/client";

export default async function SettingsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const profile = await getRequiredProfile(session.user.id).catch(() => null);
  if (!profile) {
    redirect("/onboarding");
  }

  const settings = await getOrCreateUserSettings(session.user.id);
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true } });

  const profileInitialValues = buildProfileFormValues(profile, settings.units);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-white">Settings</h1>
      <p className="mt-2 text-sm text-white/70">
        Adjust your physiology, preferences, and account controls. Translation: give the math something better than “idk I guess four drinks”.
      </p>

      <div className="mt-8 space-y-6">
        <InfoBanner
          title="What happens in here?"
          body="Everything you tweak feeds the prediction engine. If you lie, the math will roast you later."
          items={[
            "Update height/weight in whichever units make sense—conversion happens instantly.",
            "Metabolism + tolerance sliders are your starting bias. We’ll recalibrate with real nights.",
            "Units & notifications only change how the app talks to you, not your logged data.",
          ]}
        />

        <ProfileForm initialValues={profileInitialValues} />

        <SettingsForm
          initialSettings={{
            units: settings.units,
            defaultVolume: settings.defaultVolume,
            showAbvSuggestions: settings.showAbvSuggestions,
            enableNotifications: settings.enableNotifications,
            notificationThreshold: settings.notificationThreshold,
          }}
        />

        <AccountForm initialEmail={user?.email ?? ""} />
      </div>
    </main>
  );
}

function buildProfileFormValues(
  profile: Awaited<ReturnType<typeof getRequiredProfile>>,
  unitPreference: UnitSystem
): OnboardingFormValues {
  const totalInches = profile.heightCm / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }

  const preferImperial = unitPreference === "imperial";
  const weightValue = preferImperial
    ? parseFloat((profile.weightKg * 2.20462).toFixed(1))
    : profile.weightKg;

  return {
    name: profile.name,
    geoLocation: profile.geoLocation ?? "",
    profileImageUrl: profile.profileImageUrl ?? "",
    heightUnit: preferImperial ? "imperial" : "cm",
    heightCm: profile.heightCm,
    heightFeet: feet,
    heightInches: inches,
    weightUnit: preferImperial ? "lbs" : "kg",
    weightValue,
    age: profile.age,
    genderIdentity: profile.genderIdentity,
    customGender: profile.genderCustomLabel ?? "",
    menstruation: profile.menstruation ? "yes" : "no",
    cycleDay: profile.menstruation ? profile.cycleDay ?? 14 : null,
    medications: profile.medications ? "yes" : "no",
    medicationDetails: profile.medicationDetails ?? "",
    conditions: profile.conditions ? "yes" : "no",
    conditionDetails: profile.conditionDetails ?? "",
    metabolismScore: profile.metabolismScore,
    toleranceScore: profile.toleranceScore,
    targetLevel: profile.pinkdrunkTargetUser,
  };
}
