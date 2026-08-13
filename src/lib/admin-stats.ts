import { prisma } from "@/lib/db";
import {
  ADMIN_STATS_DAYS,
  countOnUtcDay,
  fillDailyBuckets,
  type DayCount,
} from "@/lib/admin-day-buckets";

export type AdminUserRow = {
  login: string;
  cardCount: number;
};

export type AdminStats = {
  userCount: number;
  cardCount: number;
  usersToday: number;
  cardsToday: number;
  accountDays: DayCount[];
  cardDays: DayCount[];
  users: AdminUserRow[];
};

export async function loadAdminStats(now = new Date()): Promise<AdminStats> {
  const [userRows, cardRows] = await Promise.all([
    prisma.user.findMany({
      select: {
        login: true,
        createdAt: true,
        _count: { select: { cards: true } },
      },
    }),
    prisma.card.findMany({
      select: { createdAt: true },
    }),
  ]);

  const userCreated = userRows.map((row) => row.createdAt);
  const cardCreated = cardRows.map((row) => row.createdAt);

  const users = userRows
    .map((row) => ({ login: row.login, cardCount: row._count.cards }))
    .sort(
      (a, b) => b.cardCount - a.cardCount || a.login.localeCompare(b.login),
    );

  return {
    userCount: userRows.length,
    cardCount: cardRows.length,
    usersToday: countOnUtcDay(userCreated, now),
    cardsToday: countOnUtcDay(cardCreated, now),
    accountDays: fillDailyBuckets(now, ADMIN_STATS_DAYS, userCreated),
    cardDays: fillDailyBuckets(now, ADMIN_STATS_DAYS, cardCreated),
    users,
  };
}
