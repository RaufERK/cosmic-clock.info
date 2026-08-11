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

export function cardDateKey(card: {
  year: number;
  month: number;
  day: number;
}): string {
  return `${card.year}-${card.month}-${card.day}`;
}
