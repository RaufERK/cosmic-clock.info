"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { mergeCardsByDate } from "@/lib/card-merge";
import {
  isGuestExampleSeedDate,
  MAX_CARDS_PER_USER,
  type CardData,
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
  sortIndex: number;
  createdAt?: Date;
  updatedAt?: Date;
}): CardData {
  return {
    id: row.id,
    name: row.name,
    day: row.day,
    month: row.month,
    year: row.year,
    sortIndex: row.sortIndex,
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

async function nextSortIndexForUser(userId: string): Promise<number> {
  const agg = await prisma.card.aggregate({
    where: { userId },
    _max: { sortIndex: true },
  });
  return (agg._max.sortIndex ?? -1) + 1;
}

export async function listMyCardsAction(): Promise<CardActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  try {
    const rows = await prisma.card.findMany({
      where: { userId },
      orderBy: [{ sortIndex: "asc" }, { id: "asc" }],
    });
    return {
      ok: true,
      cards: rows.map(toCardData),
    };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

export async function reorderCardsAction(
  orderedIds: string[],
): Promise<CardActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  if (
    !Array.isArray(orderedIds) ||
    orderedIds.some((id) => typeof id !== "string" || id.length === 0)
  ) {
    return { ok: false, error: "invalid" };
  }

  try {
    const rows = await prisma.card.findMany({
      where: { userId },
      select: { id: true },
    });
    if (orderedIds.length !== rows.length) {
      return { ok: false, error: "invalid" };
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      return { ok: false, error: "invalid" };
    }
    const owned = new Set(rows.map((r) => r.id));
    for (const id of orderedIds) {
      if (!owned.has(id)) return { ok: false, error: "invalid" };
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.card.update({
          where: { id },
          data: { sortIndex: index },
        }),
      ),
    );

    const next = await prisma.card.findMany({
      where: { userId },
      orderBy: [{ sortIndex: "asc" }, { id: "asc" }],
    });
    return { ok: true, cards: next.map(toCardData) };
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

    const sortIndex = await nextSortIndexForUser(userId);
    const row = await prisma.card.create({
      data: { ...data, userId, sortIndex },
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
      sortIndex: row.sortIndex,
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
              sortIndex: card.sortIndex ?? 0,
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
              sortIndex: card.sortIndex ?? 0,
              createdAt: card.updatedAt,
              updatedAt: card.updatedAt,
            },
          });
        }
      }
    });

    const rows = await prisma.card.findMany({
      where: { userId },
      orderBy: [{ sortIndex: "asc" }, { id: "asc" }],
    });

    const added = rows.filter((r) => !beforeIds.has(r.id)).length;

    return {
      ok: true,
      cards: rows.map(toCardData),
      mergedDates,
      added,
      truncated,
    };
  } catch {
    return { ok: false, error: "unknown" };
  }
}
