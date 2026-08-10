import type { CardFormValues } from "@/components/CardForm";

export type CardData = CardFormValues & { id: string };

/** Guest-only demo cards (not stored in DB). Names come from i18n. */
export const EXAMPLE_CARD_DATES = [
  { id: "example-1", day: 15, month: 5, year: 1995 },
  { id: "example-2", day: 12, month: 2, year: 2026 },
] as const;

export const MAX_CARDS_PER_USER = 100;

export function isExampleCardId(id: string): boolean {
  return id.startsWith("example-");
}
