import { prisma } from "@/lib/db";

export { isValidLoginFormat, normalizeLogin } from "@/lib/login";

const DAY_MS = 24 * 60 * 60 * 1000;

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
