"use server";

import { auth } from "@/auth";
import { isAdminLogin } from "@/lib/admin-access";
import { loadAdminStats, type AdminStats } from "@/lib/admin-stats";

export type AdminStatsActionResult =
  | { ok: true; stats: AdminStats }
  | { ok: false; error: "unauthorized" | "forbidden" };

function adminLoginsEnv(): string | undefined {
  return process.env["ADMIN_LOGINS"];
}

export async function getAdminStatsAction(): Promise<AdminStatsActionResult> {
  const session = await auth();
  const login = session?.user?.login;
  if (!login) {
    return { ok: false, error: "unauthorized" };
  }
  if (!isAdminLogin(login, adminLoginsEnv())) {
    return { ok: false, error: "forbidden" };
  }
  return { ok: true, stats: await loadAdminStats() };
}
