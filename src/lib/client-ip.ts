import { headers } from "next/headers";

type HeaderReader = {
  get(name: string): string | null;
};

/**
 * Client IP behind nginx: trust X-Real-IP ($remote_addr), not the first
 * X-Forwarded-For hop (that value is client-controlled when nginx appends).
 */
export function ipFromHeaders(h: HeaderReader): string {
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }

  return "unknown";
}

export async function getClientIp(): Promise<string> {
  try {
    return ipFromHeaders(await headers());
  } catch {
    return "unknown";
  }
}
