"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { mergeCardsByDate } from "@/lib/card-merge";
import {
  isGuestExampleSeedDate,
  MAX_CARDS_PER_USER,
  parseCardSortOrder,
  type CardData,
  type CardSortOrder,
} from "@/lib/cards";
import { validateStartDate } from "@/lib/start-date";

export type CardInput = {
  name: string;
  day: number;
  month: number;
  year: number;
};

export type LocalCardPayload = CardInput & {
  updatedAt?: string;
};

export type MergeCardsResult =
  | {
      ok: true;
      cards: CardData[];
      sortOrder: CardSortOrder;
      mergedDates: number;
      added: number;
      truncated: number;
    }
  | {
      ok: false;
      error: "unauthorized" | "invalid" | "unknown";
    };

export type CardActionResult =
  | {
      ok: true;
      card?: CardData;
      cards?: CardData[];
      sortOrder?: CardSortOrder;
    }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "invalid"
        | "not_found"
        | "limit"
        | "duplicate_date"
        | "unknown";
    };

function toCardData(row: {
  id: string;
  name: string;
  day: number;
  month: number;
  year: number;
  createdAt?: Date;
  updatedAt?: Date;
}): CardData {
  return {
    id: row.id,
    name: row.name,
    day: row.day,
    month: row.month,
    year: row.year,
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

function validateCardInput(input: CardInput): CardInput | null {
  const name = input.name.trim();
  const { day, month, year } = input;
  if (!name) return null;
  if (validateStartDate(year, month, day) !== null) return null;
  return { name, day, month, year };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function listMyCardsAction(): Promise<CardActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  try {
    const [rows, user] = await Promise.all([
      prisma.card.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { cardSortOrder: true },
      }),
    ]);
    return {
      ok: true,
      cards: rows.map(toCardData),
      sortOrder: parseCardSortOrder(user?.cardSortOrder),
    };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

export async function setCardSortOrderAction(
  orderRaw: string,
): Promise<CardActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  const sortOrder = parseCardSortOrder(orderRaw, "newest");
  if (sortOrder !== orderRaw) {
    return { ok: false, error: "invalid" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { cardSortOrder: sortOrder },
    });
    return { ok: true, sortOrder };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

export async function createCardAction(
  input: CardInput,
): Promise<CardActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  const data = validateCardInput(input);
  if (!data) return { ok: false, error: "invalid" };

  try {
    const count = await prisma.card.count({ where: { userId } });
    if (count >= MAX_CARDS_PER_USER) {
      return { ok: false, error: "limit" };
    }

    const duplicate = await prisma.card.findFirst({
      where: {
        userId,
        year: data.year,
        month: data.month,
        day: data.day,
      },
      select: { id: true },
    });
    if (duplicate) return { ok: false, error: "duplicate_date" };

    const row = await prisma.card.create({
      data: { ...data, userId },
    });
    return { ok: true, card: toCardData(row) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "duplicate_date" };
    }
    return { ok: false, error: "unknown" };
  }
}

export async function updateCardAction(
  id: string,
  input: CardInput,
): Promise<CardActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  const data = validateCardInput(input);
  if (!data) return { ok: false, error: "invalid" };

  try {
    const existing = await prisma.card.findFirst({
      where: { id, userId },
    });
    if (!existing) return { ok: false, error: "not_found" };

    const duplicate = await prisma.card.findFirst({
      where: {
        userId,
        year: data.year,
        month: data.month,
        day: data.day,
        NOT: { id },
      },
      select: { id: true },
    });
    if (duplicate) return { ok: false, error: "duplicate_date" };

    const row = await prisma.card.update({
      where: { id },
      data,
    });
    return { ok: true, card: toCardData(row) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "duplicate_date" };
    }
    return { ok: false, error: "unknown" };
  }
}

export async function deleteCardAction(id: string): Promise<CardActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  try {
    const existing = await prisma.card.findFirst({
      where: { id, userId },
    });
    if (!existing) return { ok: false, error: "not_found" };

    await prisma.card.delete({ where: { id } });
    return { ok: true };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

/** Merge localStorage cards into the signed-in user's DB (by start date). */
export async function mergeLocalCardsAction(
  localRaw: LocalCardPayload[],
): Promise<MergeCardsResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  const localCards = [];
  for (const item of localRaw) {
    const data = validateCardInput(item);
    if (!data) continue;
    // Demo seed (1958-08-07) stays guest-only — never import into an account.
    if (isGuestExampleSeedDate(data)) continue;
    const updatedAt = item.updatedAt
      ? new Date(item.updatedAt)
      : new Date();
    if (Number.isNaN(updatedAt.getTime())) continue;
    localCards.push({ ...data, updatedAt });
  }

  try {
    const dbRows = await prisma.card.findMany({ where: { userId } });
    const dbCards = dbRows.map((row) => ({
      id: row.id,
      name: row.name,
      day: row.day,
      month: row.month,
      year: row.year,
      updatedAt: row.updatedAt,
    }));

    const beforeIds = new Set(dbRows.map((r) => r.id));
    const { cards: merged, mergedDates, truncated } = mergeCardsByDate(
      dbCards,
      localCards,
    );

    await prisma.$transaction(async (tx) => {
      const keepIds = new Set(
        merged.map((c) => c.id).filter((id): id is string => Boolean(id)),
      );

      for (const row of dbRows) {
        if (!keepIds.has(row.id)) {
          await tx.card.delete({ where: { id: row.id } });
        }
      }

      for (const card of merged) {
        if (card.id && beforeIds.has(card.id)) {
          await tx.card.update({
            where: { id: card.id },
            data: {
              name: card.name,
              day: card.day,
              month: card.month,
              year: card.year,
              updatedAt: card.updatedAt,
            },
          });
        } else {
          await tx.card.create({
            data: {
              userId,
              name: card.name,
              day: card.day,
              month: card.month,
              year: card.year,
              createdAt: card.updatedAt,
              updatedAt: card.updatedAt,
            },
          });
        }
      }
    });

    const [rows, user] = await Promise.all([
      prisma.card.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { cardSortOrder: true },
      }),
    ]);

    const added = rows.filter((r) => !beforeIds.has(r.id)).length;

    return {
      ok: true,
      cards: rows.map(toCardData),
      sortOrder: parseCardSortOrder(user?.cardSortOrder),
      mergedDates,
      added,
      truncated,
    };
  } catch {
    return { ok: false, error: "unknown" };
  }
}
