import { deriveBodyMetrics } from "@/lib/body-composition";
import { ensureImpairmentThresholds } from "@/lib/impairment-thresholds";
import { db } from "@/lib/prisma";

export async function getRequiredProfile(userId: string) {
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new Error("Profile not found");
  }
  if (profile.bmi != null && profile.totalBodyWaterL != null) {
    await ensureImpairmentThresholds(profile.userId, profile);
    return profile;
  }

  const { bmi, totalBodyWaterL } = deriveBodyMetrics({
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    age: profile.age,
    genderIdentity: profile.genderIdentity,
  });

  const updated = await db.profile.update({
    where: { id: profile.id },
    data: {
      bmi: profile.bmi ?? bmi,
      totalBodyWaterL: profile.totalBodyWaterL ?? totalBodyWaterL,
    },
  });

  await ensureImpairmentThresholds(updated.userId, updated);

  return updated;
}
