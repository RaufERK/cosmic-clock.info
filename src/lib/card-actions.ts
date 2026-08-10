"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { MAX_CARDS_PER_USER, type CardData } from "@/lib/cards";

export type CardInput = {
  name: string;
  day: number;
  month: number;
  year: number;
};

export type CardActionResult =
  | { ok: true; card?: CardData; cards?: CardData[] }
  | {
      ok: false;
      error: "unauthorized" | "invalid" | "not_found" | "limit" | "unknown";
    };

function toCardData(row: {
  id: string;
  name: string;
  day: number;
  month: number;
  year: number;
}): CardData {
  return {
    id: row.id,
    name: row.name,
    day: row.day,
    month: row.month,
    year: row.year,
  };
}

function validateCardInput(input: CardInput): CardInput | null {
  const name = input.name.trim();
  const { day, month, year } = input;
  if (!name) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(year) || year < 1 || year > 9999) return null;
  return { name, day, month, year };
}

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function listMyCardsAction(): Promise<CardActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  try {
    const rows = await prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return { ok: true, cards: rows.map(toCardData) };
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

    const row = await prisma.card.create({
      data: { ...data, userId },
    });
    return { ok: true, card: toCardData(row) };
  } catch {
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

    const row = await prisma.card.update({
      where: { id },
      data,
    });
    return { ok: true, card: toCardData(row) };
  } catch {
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
