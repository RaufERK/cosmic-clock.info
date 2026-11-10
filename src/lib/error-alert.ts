/**
 * Server error reporting without third-party SDKs: one structured log line per error
 * and a rate-limited Telegram alert (outgoing `sendMessage` only; never call getUpdates or
 * setWebhook with this bot token).
 *
 * Never log or send request headers, bodies, query strings, or local variables.
 */

const DEDUPE_WINDOW_MS = 15 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MAX_ALERTS_PER_HOUR = 10;
const MAX_TRACKED_KEYS = 200;
const MAX_MESSAGE_LENGTH = 300;
const TELEGRAM_TIMEOUT_MS = 5000;

/** Stale browser tabs and bots after a deploy: noisy and not actionable. */
const LOG_ONLY_PATTERNS: readonly RegExp[] = [
  /Failed to find Server Action/i,
  /Server Reference ID did not match/i,
];

export type RequestErrorInfo = {
  name: string;
  message: string;
  digest: string | undefined;
  method: string;
  path: string;
  routePath: string;
  routeType: string;
  routerKind: string;
};

export type RequestErrorRequest = { path: string; method: string };

export type RequestErrorContext = {
  routerKind: string;
  routePath: string;
  routeType: string;
};

export type AlertDecision =
  | { send: false }
  | { send: true; suppressedSame: number; droppedByLimit: number };

export function stripQuery(path: string): string {
  const queryStart = path.search(/[?#]/);
  return queryStart === -1 ? path : path.slice(0, queryStart);
}

export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}

export function toRequestErrorInfo(
  error: Error & { digest?: string },
  request: RequestErrorRequest,
  context: RequestErrorContext,
): RequestErrorInfo {
  return {
    name: error.name,
    message: truncate(String(error.message), MAX_MESSAGE_LENGTH),
    digest: error.digest,
    method: request.method,
    path: stripQuery(request.path),
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
  };
}

export function isLogOnly(info: RequestErrorInfo): boolean {
  return LOG_ONLY_PATTERNS.some((pattern) => pattern.test(info.message));
}

export function buildErrorKey(info: RequestErrorInfo): string {
  return `${info.name}|${info.routePath}|${info.message.slice(0, 120)}`;
}

export function formatLogLine(info: RequestErrorInfo): string {
  return JSON.stringify({ level: "error", source: "request", ...info });
}

export function formatAlertText(
  info: RequestErrorInfo,
  suppressedSame: number,
  droppedByLimit: number,
): string {
  const lines = [
    "cosmic-clock: ошибка на сервере",
    `${info.method} ${info.path}`,
    `route: ${info.routePath} (${info.routeType})`,
    `${info.name}: ${info.message}`,
  ];
  if (info.digest) {
    lines.push(`digest: ${info.digest}`);
  }
  if (suppressedSame > 0) {
    lines.push(`Ещё ${suppressedSame} таких же ошибок за последние 15 минут не отправлялись.`);
  }
  if (droppedByLimit > 0) {
    lines.push(`Из-за лимита ${MAX_ALERTS_PER_HOUR}/час пропущено других ошибок: ${droppedByLimit}.`);
  }
  return lines.join("\n");
}

/** Per-process dedupe (15 min per error key) plus a global cap per hour. */
export function createAlertGate() {
  const lastSentAt = new Map<string, number>();
  const suppressedByKey = new Map<string, number>();
  let sentTimes: number[] = [];
  let droppedByLimit = 0;

  return {
    check(key: string, now: number): AlertDecision {
      sentTimes = sentTimes.filter((sentAt) => now - sentAt < HOUR_MS);

      const lastSent = lastSentAt.get(key);
      if (lastSent !== undefined && now - lastSent < DEDUPE_WINDOW_MS) {
        suppressedByKey.set(key, (suppressedByKey.get(key) ?? 0) + 1);
        return { send: false };
      }

      if (sentTimes.length >= MAX_ALERTS_PER_HOUR) {
        droppedByLimit += 1;
        return { send: false };
      }

      const suppressedSame = suppressedByKey.get(key) ?? 0;
      const dropped = droppedByLimit;
      suppressedByKey.delete(key);
      droppedByLimit = 0;
      sentTimes.push(now);

      lastSentAt.delete(key);
      lastSentAt.set(key, now);
      while (lastSentAt.size > MAX_TRACKED_KEYS) {
        const oldestKey = lastSentAt.keys().next().value;
        if (oldestKey === undefined) break;
        lastSentAt.delete(oldestKey);
        suppressedByKey.delete(oldestKey);
      }

      return { send: true, suppressedSame, droppedByLimit: dropped };
    },
  };
}

const alertGate = createAlertGate();

async function sendTelegramAlert(text: string): Promise<void> {
  const token = process.env.TELEGRAM_ALERT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!token || !chatId) {
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error(
        JSON.stringify({ level: "warn", source: "telegram-alert", status: response.status }),
      );
    }
  } catch (sendError) {
    // Do not log the error object: some runtimes include the request URL (and the token).
    const name = sendError instanceof Error ? sendError.name : "unknown";
    console.error(JSON.stringify({ level: "warn", source: "telegram-alert", error: name }));
  }
}

export async function reportRequestError(
  error: Error & { digest?: string },
  request: RequestErrorRequest,
  context: RequestErrorContext,
): Promise<void> {
  const info = toRequestErrorInfo(error, request, context);
  console.error(formatLogLine(info));

  if (isLogOnly(info)) {
    return;
  }

  const decision = alertGate.check(buildErrorKey(info), Date.now());
  if (!decision.send) {
    return;
  }

  await sendTelegramAlert(
    formatAlertText(info, decision.suppressedSame, decision.droppedByLimit),
  );
}
