"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export type AuthActionResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "mismatch" | "taken" | "weak" | "unknown" };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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
  email: string,
  password: string,
): Promise<AuthActionResult> {
  try {
    await signIn("credentials", {
      email,
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
  emailRaw: string,
  password: string,
  confirmPassword: string,
): Promise<AuthActionResult> {
  const email = normalizeEmail(emailRaw);

  if (!email || !password) {
    return { ok: false, error: "invalid" };
  }
  if (password.length < 6) {
    return { ok: false, error: "weak" };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "mismatch" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "taken" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { email, passwordHash },
  });

  return signInCredentials(email, password);
}

export async function loginAction(
  emailRaw: string,
  password: string,
): Promise<AuthActionResult> {
  const email = normalizeEmail(emailRaw);
  if (!email || !password) {
    return { ok: false, error: "invalid" };
  }

  return signInCredentials(email, password);
}
