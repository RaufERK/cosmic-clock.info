import type { CardFormValues } from "@/components/CardForm";

export type CardData = CardFormValues & { id: string };

export const SEED_CARDS: CardData[] = [
  { id: "1", name: "Персональная карта", day: 15, month: 5, year: 1995 },
  { id: "2", name: "Транзиты 2026", day: 12, month: 2, year: 2026 },
];

const STORAGE_KEY = "cosmic-clock.cards";

export function readCards(): CardData[] {
  if (typeof window === "undefined") return SEED_CARDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_CARDS;
    const parsed = JSON.parse(raw) as CardData[];
    return Array.isArray(parsed) ? parsed : SEED_CARDS;
  } catch {
    return SEED_CARDS;
  }
}

export function writeCards(cards: CardData[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}
