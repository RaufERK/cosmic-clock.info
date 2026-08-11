import type { CardFormValues } from "@/components/CardForm";

export type CardData = CardFormValues & {
  id: string;
  /** ISO timestamp; used for merge freshness (localStorage + DB). */
  updatedAt?: string;
};

/** Single guest seed: The Summit Lighthouse founded 7 Aug 1958. Name from i18n. */
export const GUEST_EXAMPLE_SEED = {
  id: "example-summit",
  day: 7,
  month: 8,
  year: 1958,
} as const;

export const MAX_CARDS_PER_USER = 100;

export function isExampleCardId(id: string): boolean {
  return id.startsWith("example-");
}

/** Guest demo date only — never migrate into a signed-in account. */
export function isGuestExampleSeedDate(card: {
  year: number;
  month: number;
  day: number;
}): boolean {
  return (
    card.year === GUEST_EXAMPLE_SEED.year &&
    card.month === GUEST_EXAMPLE_SEED.month &&
    card.day === GUEST_EXAMPLE_SEED.day
  );
}

export function cardDateKey(card: {
  year: number;
  month: number;
  day: number;
}): string {
  return `${card.year}-${card.month}-${card.day}`;
}
