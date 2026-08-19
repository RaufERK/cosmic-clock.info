import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ipFromHeaders } from "@/lib/client-ip";
import { STAT_EVENT_KIND } from "@/lib/stat-event";
import { consumeStatAttempt } from "@/lib/stat-rate-limit";

/** Public: one StatEvent row per guest card create. Empty body. */
export async function POST(request: Request) {
  const limited = consumeStatAttempt(
    `stat:${ipFromHeaders(request.headers)}`,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  await prisma.statEvent.create({
    data: { kind: STAT_EVENT_KIND.guestCardCreate },
  });

  return new NextResponse(null, { status: 204 });
}
