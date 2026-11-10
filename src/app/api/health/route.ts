import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const DB_CHECK_TIMEOUT_MS = 3000;

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("db_timeout")), ms);
  });
}

/** Public liveness check for uptime monitors: app is up and the database answers. */
export async function GET() {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      timeout(DB_CHECK_TIMEOUT_MS),
    ]);
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
