export const STAT_EVENT_KIND = {
  guestCardCreate: "guest_card_create",
} as const;

export type StatEventKind =
  (typeof STAT_EVENT_KIND)[keyof typeof STAT_EVENT_KIND];
