import { describe, expect, it } from "vitest";
import { ipFromHeaders } from "@/lib/client-ip";

function headerMap(entries: Record<string, string>): {
  get(name: string): string | null;
} {
  const map = new Map(
    Object.entries(entries).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    get(name: string) {
      return map.get(name.toLowerCase()) ?? null;
    },
  };
}

describe("ipFromHeaders", () => {
  it("prefers X-Real-IP over a spoofed X-Forwarded-For chain", () => {
    expect(
      ipFromHeaders(
        headerMap({
          "x-forwarded-for": "1.2.3.4, 185.200.178.73",
          "x-real-ip": "203.0.113.10",
        }),
      ),
    ).toBe("203.0.113.10");
  });

  it("uses the last X-Forwarded-For hop when X-Real-IP is missing", () => {
    expect(
      ipFromHeaders(headerMap({ "x-forwarded-for": "1.2.3.4, 203.0.113.10" })),
    ).toBe("203.0.113.10");
  });

  it("returns unknown when no IP headers are present", () => {
    expect(ipFromHeaders(headerMap({}))).toBe("unknown");
  });
});
