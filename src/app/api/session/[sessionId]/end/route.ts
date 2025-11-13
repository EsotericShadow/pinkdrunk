import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { endSession, getSessionById } from "@/lib/session-repository";

const payloadSchema = z.object({
  reason: z.enum(["user_end", "auto_alert", "timeout"]).default("user_end"),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const active = await getSessionById(sessionId, session.user.id);
  if (!active) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const parsed = payloadSchema.safeParse(await request.json().catch(() => ({})));

  await endSession(active.id, parsed.success ? parsed.data.reason : "user_end");

  return NextResponse.json({ success: true });
}
