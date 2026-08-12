import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Temporary verification endpoint — remove after Sentry is confirmed.
 * GET /api/sentry-test  (only when ALLOW_SENTRY_TEST=1)
 */
export async function GET() {
  if (process.env.ALLOW_SENTRY_TEST !== "1") {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }

  const err = new Error("Sentry test error — delete /api/sentry-test after verify");
  Sentry.captureException(err);
  await Sentry.flush(2000);

  return NextResponse.json({
    ok: true,
    message: "Test error sent to Sentry (if DSN is set)",
  });
}
