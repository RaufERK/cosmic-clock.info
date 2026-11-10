import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildErrorKey,
  createAlertGate,
  formatAlertText,
  formatLogLine,
  isLogOnly,
  reportRequestError,
  stripQuery,
  toRequestErrorInfo,
  truncate,
} from "./error-alert";

const MINUTE_MS = 60 * 1000;

function makeInfo(message = "boom", routePath = "/[locale]/cards") {
  return toRequestErrorInfo(
    Object.assign(new Error(message), { digest: "d123" }),
    { method: "POST", path: "/en/cards?token=secret#x" },
    { routerKind: "App Router", routePath, routeType: "action" },
  );
}

describe("request error info", () => {
  it("drops the query string and hash from the path", () => {
    expect(stripQuery("/en/cards?token=secret")).toBe("/en/cards");
    expect(stripQuery("/en/cards#x")).toBe("/en/cards");
    expect(stripQuery("/en/cards")).toBe("/en/cards");
  });

  it("truncates long messages", () => {
    expect(truncate("abcdef", 4)).toBe("abc…");
    expect(truncate("abc", 4)).toBe("abc");
  });

  it("never puts the query string into log or alert text", () => {
    const info = makeInfo();
    expect(formatLogLine(info)).not.toContain("secret");
    expect(formatAlertText(info, 0, 0)).not.toContain("secret");
  });

  it("marks stale Server Action errors as log-only", () => {
    expect(isLogOnly(makeInfo("Failed to find Server Action abc"))).toBe(true);
    expect(
      isLogOnly(makeInfo('The Server Reference ID did not match the expected format. Received "x".')),
    ).toBe(true);
    expect(isLogOnly(makeInfo("Cannot read properties of undefined"))).toBe(false);
  });
});

describe("alert gate", () => {
  it("sends the first error and suppresses repeats for 15 minutes", () => {
    const gate = createAlertGate();
    const key = buildErrorKey(makeInfo());

    expect(gate.check(key, 0)).toEqual({ send: true, suppressedSame: 0, droppedByLimit: 0 });
    expect(gate.check(key, 5 * MINUTE_MS)).toEqual({ send: false });
    expect(gate.check(key, 10 * MINUTE_MS)).toEqual({ send: false });
    expect(gate.check(key, 16 * MINUTE_MS)).toEqual({
      send: true,
      suppressedSame: 2,
      droppedByLimit: 0,
    });
  });

  it("treats different errors independently", () => {
    const gate = createAlertGate();
    expect(gate.check("a", 0).send).toBe(true);
    expect(gate.check("b", 1).send).toBe(true);
  });

  it("caps alerts at 10 per hour and reports how many were dropped", () => {
    const gate = createAlertGate();
    for (let i = 0; i < 10; i += 1) {
      expect(gate.check(`key-${i}`, i).send).toBe(true);
    }
    expect(gate.check("key-10", 100)).toEqual({ send: false });
    expect(gate.check("key-11", 200)).toEqual({ send: false });

    expect(gate.check("key-12", 61 * MINUTE_MS)).toEqual({
      send: true,
      suppressedSame: 0,
      droppedByLimit: 2,
    });
  });
});

describe("reportRequestError", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("logs but does not call Telegram when the bot is not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await reportRequestError(
      new Error("unconfigured"),
      { method: "GET", path: "/en" },
      { routerKind: "App Router", routePath: "/[locale]", routeType: "render" },
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a Telegram message with a plain-text body and never leaks the token into logs", async () => {
    vi.stubEnv("TELEGRAM_ALERT_BOT_TOKEN", "123:secret-token");
    vi.stubEnv("TELEGRAM_ALERT_CHAT_ID", "42");
    const fetchMock = vi.fn().mockRejectedValue(new Error("https://api.telegram.org/bot123:secret-token/sendMessage failed"));
    vi.stubGlobal("fetch", fetchMock);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await reportRequestError(
      new Error("send-failure-case"),
      { method: "GET", path: "/en/x?y=1" },
      { routerKind: "App Router", routePath: "/[locale]/x", routeType: "render" },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/sendMessage");
    const body = JSON.parse(String(init.body)) as { chat_id: string; text: string };
    expect(body.chat_id).toBe("42");
    expect(body.text).toContain("send-failure-case");
    expect(body.text).not.toContain("y=1");

    const logged = errorSpy.mock.calls.flat().join("\n");
    expect(logged).not.toContain("secret-token");
  });

  it("does not alert for log-only errors", async () => {
    vi.stubEnv("TELEGRAM_ALERT_BOT_TOKEN", "123:t");
    vi.stubEnv("TELEGRAM_ALERT_CHAT_ID", "42");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await reportRequestError(
      new Error("Failed to find Server Action xyz"),
      { method: "POST", path: "/en" },
      { routerKind: "App Router", routePath: "/[locale]", routeType: "action" },
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
