import { prisma } from "@/lib/db";
import {
  ADMIN_STATS_DAYS,
  addUtcDays,
  countOnUtcDay,
  fillDailyBuckets,
  utcDayStart,
  type DayCount,
} from "@/lib/admin-day-buckets";
import { STAT_EVENT_KIND } from "@/lib/stat-event";

export type AdminUserRow = {
  login: string;
  cardCount: number;
};

export type AdminStats = {
  userCount: number;
  cardCount: number;
  usersToday: number;
  cardsToday: number;
  guestCreateCount: number;
  guestCreatesToday: number;
  accountDays: DayCount[];
  cardDays: DayCount[];
  guestCreateDays: DayCount[];
  users: AdminUserRow[];
};

export async function loadAdminStats(now = new Date()): Promise<AdminStats> {
  const windowStart = addUtcDays(utcDayStart(now), -(ADMIN_STATS_DAYS - 1));
  const [userRows, cardRows, guestCreateCount, guestRecent] = await Promise.all(
    [
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
      prisma.statEvent.count({
        where: { kind: STAT_EVENT_KIND.guestCardCreate },
      }),
      prisma.statEvent.findMany({
        where: {
          kind: STAT_EVENT_KIND.guestCardCreate,
          createdAt: { gte: windowStart },
        },
        select: { createdAt: true },
      }),
    ],
  );

  const userCreated = userRows.map((row) => row.createdAt);
  const cardCreated = cardRows.map((row) => row.createdAt);
  const guestCreated = guestRecent.map((row) => row.createdAt);

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
    guestCreateCount,
    guestCreatesToday: countOnUtcDay(guestCreated, now),
    accountDays: fillDailyBuckets(now, ADMIN_STATS_DAYS, userCreated),
    cardDays: fillDailyBuckets(now, ADMIN_STATS_DAYS, cardCreated),
    guestCreateDays: fillDailyBuckets(now, ADMIN_STATS_DAYS, guestCreated),
    users,
  };
}
