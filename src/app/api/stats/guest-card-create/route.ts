import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { STAT_EVENT_KIND } from "@/lib/stat-event";
import { consumeStatAttempt } from "@/lib/stat-rate-limit";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

/** Public: one StatEvent row per guest card create. Empty body. */
export async function POST(request: Request) {
  const limited = consumeStatAttempt(`stat:${clientIp(request)}`);
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
