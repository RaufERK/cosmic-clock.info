"use server";

import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
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
    return { ok: true };
  } catch (error) {
    if (isNextRedirect(error)) {
      return { ok: true };
    }
    if (error instanceof AuthError) {
      return { ok: false, error: "invalid" };
    }
    return { ok: false, error: "unknown" };
  }
}

export async function registerAction(
  loginRaw: string,
  password: string,
  confirmPassword: string,
): Promise<AuthActionResult> {
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
