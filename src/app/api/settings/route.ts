import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { getOrCreateUserSettings, upsertUserSettings } from "@/lib/settings";

const payloadSchema = z.object({
  units: z.enum(["metric", "imperial"]),
  defaultVolume: z.number().min(30).max(2000).nullable().optional().default(null),
  showAbvSuggestions: z.boolean(),
  enableNotifications: z.boolean(),
  notificationThreshold: z.number().min(1).max(10).nullable().optional().default(null),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getOrCreateUserSettings(session.user.id);
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const settings = await upsertUserSettings(session.user.id, parsed.data);
  return NextResponse.json({ settings });
}
