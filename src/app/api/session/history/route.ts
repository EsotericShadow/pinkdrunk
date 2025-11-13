import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { listRecentSessions } from "@/lib/session-repository";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await listRecentSessions(session.user.id, 10);

  return NextResponse.json({ sessions });
}
