import { isGuestExampleSeedDate } from "@/lib/cards";

/** User-created guest cards only — skip the app-injected Summit seed date. */
export function shouldReportGuestCardCreate(card: {
  year: number;
  month: number;
  day: number;
}): boolean {
  return !isGuestExampleSeedDate(card);
}

/**
 * Fire-and-forget. Never await in UI. Failures are ignored.
 * No body: server stamps createdAt.
 */
export function reportGuestCardCreate(card: {
  year: number;
  month: number;
  day: number;
}): void {
  if (typeof window === "undefined") return;
  if (!shouldReportGuestCardCreate(card)) return;

  void fetch("/api/stats/guest-card-create", {
    method: "POST",
    keepalive: true,
  }).catch(() => {
    /* ignore */
  });
}
