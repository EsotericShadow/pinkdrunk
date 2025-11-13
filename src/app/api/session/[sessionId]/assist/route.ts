import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { getRequiredProfile } from "@/lib/profile";
import { computeSessionPrediction } from "@/lib/session-calculator";
import {
  appendCareEvent,
  appendDrink,
  getSessionById,
  recordReportedLevel,
} from "@/lib/session-repository";
import {
  ensureImpairmentThresholds,
  toThresholdSnapshots,
  updateThresholdsWithObservation,
} from "@/lib/impairment-thresholds";
import { drinkPayloadSchema } from "@/lib/validation/drink-payload";

const attachmentSchema = z.object({
  type: z.literal("image"),
  dataUrl: z.string().min(1),
});

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().optional().default(""),
  attachments: z.array(attachmentSchema).optional(),
});

const logDrinkSchema = drinkPayloadSchema.pick({
  category: true,
  label: true,
  abvPercent: true,
  volumeMl: true,
  consumedAt: true,
  ingestionMins: true,
});

const logCareSchema = z.object({
  type: z.enum(["water", "snack", "meal"]),
  volumeMl: z.number().min(0).max(2000).optional().nullable(),
});

const recordFeelSchema = z.object({
  level: z.number().min(0).max(10),
});

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "log_drink",
      description:
        "Log a drink with precise numbers. Always include category, volume in milliliters, and ABV percent."
        + " Use this whenever the user describes a pour or shares a photo.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "One of beer, wine, cocktail, shot, other",
            enum: ["beer", "wine", "cocktail", "shot", "other"],
          },
          label: { type: "string", description: "Friendly label like \"Hazy IPA\"" },
          abvPercent: { type: "number", description: "Alcohol percentage (e.g. 6.5)" },
          volumeMl: { type: "number", description: "Volume in milliliters" },
          ingestionMins: { type: "number", description: "Minutes to finish the drink" },
          consumedAt: { type: "string", description: "ISO timestamp for when the drink happened" },
        },
        required: ["category", "abvPercent", "volumeMl"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_care_event",
      description: "Record hydration or food when the user mentions water/snacks/meals.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["water", "snack", "meal"] },
          volumeMl: { type: "number" },
        },
        required: ["type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_feeling",
      description: "Capture how the user feels on the PinkDrunk 0-10 scale.",
      parameters: {
        type: "object",
        properties: {
          level: { type: "number", minimum: 0, maximum: 10 },
        },
        required: ["level"],
      },
    },
  },
];

type GrokMessage = {
  role: "system" | "user" | "assistant";
  content: Array<{ type: "text"; text: string } | { type: "input_image"; image_url: { url: string } }>;
};

type GrokToolCall = {
  id: string;
  function: {
    name: "log_drink" | "log_care_event" | "record_feeling";
    arguments: string;
  };
};

type GrokResponse = {
  choices: Array<{
    message: {
      content?: string | Array<{ type: "text"; text: string }>;
      tool_calls?: GrokToolCall[];
    };
  }>;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const auth = await getAuthSession();

  if (!auth?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = z
    .object({ messages: z.array(messageSchema).min(1) })
    .safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let sessionRecord = await getSessionById(sessionId, auth.user.id);
  if (!sessionRecord || sessionRecord.endedAt) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const profile = await getRequiredProfile(auth.user.id);
  let grokResponse: GrokResponse;
  try {
    grokResponse = await callGrok(parsed.data.messages, sessionRecord, profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant unavailable";
    const status = message.includes("GROK_API_KEY") ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }

  const assistantMessage = extractAssistantText(grokResponse);
  const toolCalls = grokResponse.choices?.[0]?.message?.tool_calls ?? [];
  const toolSummaries: string[] = [];

  for (const call of toolCalls) {
    const summary = await executeToolCall({
      call,
      sessionId,
      userId: auth.user.id,
      profile,
    });
    if (summary) {
      toolSummaries.push(summary.message);
      sessionRecord = summary.session;
    }
  }

  sessionRecord = await getSessionById(sessionId, auth.user.id);
  if (!sessionRecord) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const thresholds = await ensureImpairmentThresholds(auth.user.id, profile);
  const snapshots = toThresholdSnapshots(thresholds);
  const prediction = computeSessionPrediction({
    session: sessionRecord,
    drinks: sessionRecord.drinks,
    careEvents: sessionRecord.careEvents,
    profile,
    thresholds: snapshots,
  });

  const finalText = [assistantMessage, ...toolSummaries].filter(Boolean).join("\n\n").trim() ||
    "Logged.";

  return NextResponse.json({
    messages: [{ role: "assistant", content: finalText }],
    session: {
      id: sessionRecord.id,
      startedAt: sessionRecord.startedAt,
      targetLevel: sessionRecord.targetLevel,
      reportedLevel: sessionRecord.reportedLevel,
      reportedAt: sessionRecord.reportedAt,
      drinks: sessionRecord.drinks,
      careEvents: sessionRecord.careEvents,
    },
    prediction,
  });
}

async function executeToolCall({
  call,
  sessionId,
  userId,
  profile,
}: {
  call: GrokToolCall;
  sessionId: string;
  userId: string;
  profile: Awaited<ReturnType<typeof getRequiredProfile>>;
}): Promise<{ message: string; session: Awaited<ReturnType<typeof getSessionById>> } | null> {
  let session = await getSessionById(sessionId, userId);
  if (!session) {
    return null;
  }

  const args = safeJson(call.function.arguments);

  if (call.function.name === "log_drink") {
    const parsed = logDrinkSchema.safeParse(args);
    if (!parsed.success) {
      return { message: "Could not parse drink details.", session };
    }
    await appendDrink(sessionId, {
      category: parsed.data.category,
      label: parsed.data.label,
      abvPercent: parsed.data.abvPercent,
      volumeMl: parsed.data.volumeMl,
      consumedAt: parsed.data.consumedAt ? new Date(parsed.data.consumedAt) : undefined,
      ingestionMins: parsed.data.ingestionMins,
    });
    session = await getSessionById(sessionId, userId);
    if (!session) return null;
    return {
      message: `Logged ${parsed.data.label ?? parsed.data.category} (${parsed.data.volumeMl}ml at ${parsed.data.abvPercent}% ABV).`,
      session,
    };
  }

  if (call.function.name === "log_care_event") {
    const parsed = logCareSchema.safeParse(args);
    if (!parsed.success) {
      return { message: "Could not parse care event.", session };
    }
    await appendCareEvent(sessionId, {
      type: parsed.data.type,
      volumeMl: parsed.data.volumeMl ?? null,
    });
    session = await getSessionById(sessionId, userId);
    if (!session) return null;
    const label = parsed.data.type === "water" ? `water ${(parsed.data.volumeMl ?? 0)}ml` : parsed.data.type;
    return {
      message: `Logged ${label}.`,
      session,
    };
  }

  if (call.function.name === "record_feeling") {
    const parsed = recordFeelSchema.safeParse(args);
    if (!parsed.success) {
      return { message: "Could not parse level report.", session };
    }

    const thresholdsBefore = await ensureImpairmentThresholds(userId, profile);
    const snapshots = toThresholdSnapshots(thresholdsBefore);
    const predictionBefore = computeSessionPrediction({
      session,
      drinks: session.drinks,
      careEvents: session.careEvents,
      profile,
      thresholds: snapshots,
    });

    await recordReportedLevel(sessionId, parsed.data.level);
    await updateThresholdsWithObservation({
      thresholds: thresholdsBefore,
      observationLevel: parsed.data.level,
      observationGrams: predictionBefore.absorbedAlcoholGrams,
    });

    session = await getSessionById(sessionId, userId);
    if (!session) return null;

    return {
      message: `Saved your level ${parsed.data.level.toFixed(1)}.`,
      session,
    };
  }

  return null;
}

function safeJson(payload: string | undefined) {
  if (!payload) return {};
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

function extractAssistantText(response: GrokResponse) {
  const raw = response.choices?.[0]?.message?.content;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .filter((part) => part.type === "text")
      .map((part) => "text" in part ? part.text : "")
      .join("\n")
      .trim();
  }
  return "";
}

async function callGrok(
  messages: z.infer<typeof messageSchema>[] ,
  session: NonNullable<Awaited<ReturnType<typeof getSessionById>>>,
  profile: Awaited<ReturnType<typeof getRequiredProfile>>
) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error("GROK_API_KEY is not configured.");
  }

  const grokMessages: GrokMessage[] = [buildSystemPrompt(session, profile)];

  messages.forEach((message) => {
    const parts: GrokMessage["content"] = [];
    if (message.content) {
      parts.push({ type: "text", text: message.content });
    }
    message.attachments?.forEach((attachment) => {
      parts.push({ type: "input_image", image_url: { url: attachment.dataUrl } });
    });
    grokMessages.push({ role: message.role, content: parts });
  });

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-2",
      temperature: 0.2,
      tools: TOOL_DEFINITIONS,
      messages: grokMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Grok request failed");
  }

  return (await response.json()) as GrokResponse;
}

function buildSystemPrompt(
  session: NonNullable<Awaited<ReturnType<typeof getSessionById>>>,
  profile: Awaited<ReturnType<typeof getRequiredProfile>>
): GrokMessage {
  const pinkScale = `PinkDrunk scale cheat sheet (word ↔ level):\n` +
    `0 = Stone cold sober\n` +
    `1 = Sober (baseline)\n` +
    `2 = Buzzed / warm-up\n` +
    `3 = Mini tipsy / edges soft\n` +
    `4 = Tipsy / peak social\n` +
    `5 = Drunk / classic drunk\n` +
    `6 = PinkDrunk (target sweet spot)\n` +
    `7 = Wasted\n` +
    `8 = Blackout likely\n` +
    `9 = Danger / body throws flags\n` +
    `10 = Emergency`;

  const drinkList = session.drinks
    .map((drink) => `- ${drink.label ?? drink.category} · ${drink.volumeMl}ml @ ${drink.abvPercent}%`)
    .join("\n") || "- No drinks logged yet";

  const context =
    `You are PinkDrunk, a harm-reduction drinking companion. Keep replies short, friendly, and actionable.` +
    `\nCurrent target level: ${session.targetLevel}. User tolerance: ${profile.toleranceScore}/10.` +
    `\nUse this scale mapping whenever the user describes how they feel and convert words into numeric levels:\n${pinkScale}` +
    `\nLogged drinks:\n${drinkList}` +
    `\nWhen a user describes a drink, water, snack, or how they feel, ALWAYS call the matching tool.` +
    `\nIf details are missing (volume, timing, ABV, hydration, food), ask a brief follow-up before calling a function.` +
    `\nIf they say a drink happened earlier, set consumedAt accordingly. Do not hallucinate details.`;

  return {
    role: "system",
    content: [{ type: "text", text: context }],
  };
}
