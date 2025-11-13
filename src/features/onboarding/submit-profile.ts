import type { OnboardingFormValues } from "./schema";

const heightConverters = {
  cm: (values: OnboardingFormValues) => parseFloat((values.heightCm ?? 0).toFixed(2)),
  imperial: (values: OnboardingFormValues) =>
    parseFloat(
      (((values.heightFeet ?? 0) * 30.48) + ((values.heightInches ?? 0) * 2.54)).toFixed(2)
    ),
} as const;

const weightConverters = {
  kg: (values: OnboardingFormValues) => parseFloat(values.weightValue.toFixed(2)),
  lbs: (values: OnboardingFormValues) =>
    parseFloat((values.weightValue * 0.453592).toFixed(2)),
} as const;

const detailForFlag = (flag: "yes" | "no", value?: string | null) =>
  flag === "yes" ? value ?? "" : "";

export type ProfilePayload = {
  name: string;
  geoLocation: string;
  profileImageUrl: string | null;
  heightCm: number;
  weightKg: number;
  cycleDay: number | null;
  age: number;
  genderIdentity: OnboardingFormValues["genderIdentity"];
  genderCustomLabel: string;
  menstruation: boolean;
  medications: boolean;
  medicationDetails: string;
  conditions: boolean;
  conditionDetails: string;
  metabolismScore: number;
  toleranceScore: number;
  targetLevel: number;
};

export function buildProfilePayload(values: OnboardingFormValues): ProfilePayload {
  const {
    name,
    geoLocation = "",
    profileImageUrl,
    age,
    genderIdentity,
    customGender,
    menstruation,
    cycleDay,
    medications,
    medicationDetails,
    conditions,
    conditionDetails,
    metabolismScore,
    toleranceScore,
    targetLevel,
  } = values;

  const heightCm = heightConverters[values.heightUnit](values);
  const weightKg = weightConverters[values.weightUnit](values);
  const normalizedCycleDay = menstruation === "yes" ? cycleDay ?? null : null;
  const normalizedImageUrl = profileImageUrl?.trim() ? profileImageUrl.trim() : null;

  return {
    name,
    geoLocation,
    profileImageUrl: normalizedImageUrl,
    heightCm,
    weightKg,
    cycleDay: normalizedCycleDay,
    age,
    genderIdentity,
    genderCustomLabel: genderIdentity === "custom" ? customGender?.trim() ?? "" : "",
    menstruation: menstruation === "yes",
    medications: medications === "yes",
    medicationDetails: detailForFlag(medications, medicationDetails),
    conditions: conditions === "yes",
    conditionDetails: detailForFlag(conditions, conditionDetails),
    metabolismScore,
    toleranceScore,
    targetLevel,
  };
}

export async function postProfile(values: OnboardingFormValues) {
  const payload = buildProfilePayload(values);
  return fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
