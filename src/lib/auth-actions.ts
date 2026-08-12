"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  clearAuthAttempts,
  consumeAuthAttempt,
} from "@/lib/auth-rate-limit";
import {
  isValidLoginFormat,
  normalizeLogin,
  touchLastSeen,
} from "@/lib/user-activity";

export type AuthActionResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "invalid"
        | "mismatch"
        | "taken"
        | "weak"
        | "wrong_password"
        | "unauthorized"
        | "rate_limited"
        | "unknown";
    };

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

/** Auth.js failed credentials (wrong login/password) — not a real crash. */
function isCredentialsFailure(error: unknown): boolean {
  if (error instanceof AuthError) return true;
  if (typeof error !== "object" || error === null) return false;
  const typed = error as { type?: string; name?: string };
  return (
    typed.type === "CredentialsSignin" || typed.name === "CredentialsSignin"
  );
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

function authRateKey(ip: string): string {
  return `auth:${ip}`;
}

async function guardAuthRateLimit(): Promise<AuthActionResult | null> {
  const ip = await clientIp();
  const limited = consumeAuthAttempt(authRateKey(ip));
  if (!limited.ok) {
    return { ok: false, error: "rate_limited" };
  }
  return null;
}

async function clearAuthRateLimit(): Promise<void> {
  const ip = await clientIp();
  clearAuthAttempts(authRateKey(ip));
}

async function signInCredentials(
  login: string,
  password: string,
): Promise<AuthActionResult> {
  try {
    await signIn("credentials", {
      login,
      password,
      redirect: false,
    });
    await clearAuthRateLimit();
    return { ok: true };
  } catch (error) {
    if (isNextRedirect(error)) {
      await clearAuthRateLimit();
      return { ok: true };
    }
    if (isCredentialsFailure(error)) {
      return { ok: false, error: "invalid" };
    }
    console.error("[auth-actions] signIn unexpected", error);
    return { ok: false, error: "unknown" };
  }
}

export async function registerAction(
  loginRaw: string,
  password: string,
  confirmPassword: string,
): Promise<AuthActionResult> {
  const blocked = await guardAuthRateLimit();
  if (blocked) return blocked;

  const login = normalizeLogin(loginRaw);

  if (!isValidLoginFormat(login) || !password) {
    return { ok: false, error: "invalid" };
  }
  if (password.length < 6) {
    return { ok: false, error: "weak" };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "mismatch" };
  }

  const existing = await prisma.user.findUnique({ where: { login } });
  if (existing) {
    return { ok: false, error: "taken" };
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  await prisma.user.create({
    data: { login, passwordHash, lastSeenAt: now },
  });

  return signInCredentials(login, password);
}

export async function loginAction(
  loginRaw: string,
  password: string,
): Promise<AuthActionResult> {
  const blocked = await guardAuthRateLimit();
  if (blocked) return blocked;

  const login = normalizeLogin(loginRaw);
  if (!isValidLoginFormat(login) || !password) {
    return { ok: false, error: "invalid" };
  }

  return signInCredentials(login, password);
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<AuthActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: "unauthorized" };
  }

  if (!currentPassword || !newPassword) {
    return { ok: false, error: "invalid" };
  }
  if (newPassword.length < 6) {
    return { ok: false, error: "weak" };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "mismatch" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "wrong_password" };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { ok: true };
}

/** Throttled lastSeenAt bump for signed-in visits (safe to call often). */
export async function touchLastSeenAction(): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  try {
    await touchLastSeen(userId);
  } catch {
    // Non-critical; ignore
  }
}
