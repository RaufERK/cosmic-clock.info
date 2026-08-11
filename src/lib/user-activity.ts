import { prisma } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Normalize login for storage and lookup (trim + lowercase). */
export function normalizeLogin(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidLoginFormat(login: string): boolean {
  return login.length >= 1 && login.length <= 64;
}

/** Update lastSeenAt if missing or older than ~1 day. */
export async function touchLastSeen(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastSeenAt: true },
  });
  if (!user) return;

  const age = Date.now() - user.lastSeenAt.getTime();
  if (age < DAY_MS) return;

  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  });
}
