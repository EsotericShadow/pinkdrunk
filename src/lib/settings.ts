import type { UserSettings, UnitSystem } from "@prisma/client";

import { db } from "@/lib/prisma";

export async function getOrCreateUserSettings(userId: string): Promise<UserSettings> {
  const existing = await db.userSettings.findUnique({ where: { userId } });
  if (existing) {
    return existing;
  }
  return db.userSettings.create({
    data: {
      userId,
      units: "metric",
      defaultVolume: 355,
      showAbvSuggestions: true,
      enableNotifications: true,
      notificationThreshold: 7,
    },
  });
}

export type SettingsPayload = {
  units: UnitSystem;
  defaultVolume: number | null;
  showAbvSuggestions: boolean;
  enableNotifications: boolean;
  notificationThreshold: number | null;
};

export async function upsertUserSettings(userId: string, payload: SettingsPayload) {
  return db.userSettings.upsert({
    where: { userId },
    update: payload,
    create: {
      userId,
      ...payload,
    },
  });
}
