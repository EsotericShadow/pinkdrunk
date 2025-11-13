import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/prisma";

const payloadSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).nullable().optional(),
});

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

  const { email, currentPassword, newPassword } = parsed.data;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const updatedData: { email?: string; passwordHash?: string } = {};

  if (email && email !== user.email) {
    const emailTaken = await db.user.findUnique({ where: { email } });
    if (emailTaken && emailTaken.id !== user.id) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    updatedData.email = email;
  }

  if (newPassword) {
    updatedData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updatedData).length === 0) {
    return NextResponse.json({ success: true });
  }

  await db.user.update({ where: { id: user.id }, data: updatedData });

  return NextResponse.json({ success: true });
}
