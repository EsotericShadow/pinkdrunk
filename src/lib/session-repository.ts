import type { RecommendedAction, DrinkCategory, CareEventType } from "@prisma/client";
import { db } from "@/lib/prisma";

export async function getActiveSession(userId: string) {
  return db.drinkingSession.findFirst({
    where: {
      userId,
      endedAt: null,
    },
    include: {
      drinks: {
        orderBy: { consumedAt: "asc" },
      },
      predictions: {
        orderBy: { producedAt: "desc" },
        take: 1,
      },
      careEvents: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });
}

export async function createSession(userId: string, targetLevel: number) {
  return db.drinkingSession.create({
    data: {
      userId,
      targetLevel,
    },
  });
}

export async function appendDrink(sessionId: string, drink: {
  category: DrinkCategory;
  label?: string | null;
  abvPercent: number;
  volumeMl: number;
  brandId?: string | null;
  presetId?: string | null;
  mixedDrinkId?: string | null;
  consumedAt?: Date;
  ingestionMins?: number;
}) {
  return db.drink.create({
    data: {
      sessionId,
      category: drink.category,
      label: drink.label,
      abvPercent: drink.abvPercent,
      volumeMl: drink.volumeMl,
      brandId: drink.brandId,
      presetId: drink.presetId,
      mixedDrinkId: drink.mixedDrinkId,
      consumedAt: drink.consumedAt ?? new Date(),
      ingestionMins: drink.ingestionMins ?? 10,
    },
  });
}

export async function appendCareEvent(sessionId: string, event: {
  type: CareEventType;
  volumeMl?: number | null;
}) {
  return db.careEvent.create({
    data: {
      sessionId,
      type: event.type,
      volumeMl: event.volumeMl ?? null,
    },
  });
}

export async function recordPrediction(sessionId: string, prediction: {
  levelEstimate: number;
  bac: number;
  adjustedBac: number;
  drinksToTarget: number;
  recommendedAction: RecommendedAction;
  minutesToTarget: number;
  targetLevel: number;
  targetBac: number;
}) {
  return db.prediction.create({
    data: {
      sessionId,
      levelEstimate: prediction.levelEstimate,
      drinksToTarget: prediction.drinksToTarget,
      recommendedAction: prediction.recommendedAction,
      confidenceLow: null,
      confidenceHigh: null,
      nextDrinkEtaMinutes: prediction.minutesToTarget,
    },
  });
}

export async function recordReportedLevel(sessionId: string, reportedLevel: number) {
  return db.drinkingSession.update({
    where: { id: sessionId },
    data: {
      reportedLevel,
      reportedAt: new Date(),
    },
  });
}

export async function endSession(sessionId: string, endedReason: "user_end" | "auto_alert" | "timeout") {
  return db.drinkingSession.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      endedReason,
    },
  });
}

export async function listRecentSessions(userId: string, limit = 10) {
  return db.drinkingSession.findMany({
    where: {
      userId,
      endedAt: {
        not: null,
      },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      drinks: true,
      predictions: {
        orderBy: { producedAt: "desc" },
        take: 1,
      },
      careEvents: true,
    },
  });
}

export async function getSessionById(sessionId: string, userId: string) {
  return db.drinkingSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      drinks: {
        orderBy: { consumedAt: "asc" },
      },
      careEvents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
