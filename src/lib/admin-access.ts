import { normalizeLogin } from "@/lib/login";

/** Parse `ADMIN_LOGINS` (comma-separated) into normalized unique logins. */
export function parseAdminLogins(raw: string | undefined): string[] {
  if (!raw) return [];

  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const login = normalizeLogin(part);
    if (login) seen.add(login);
  }
  return [...seen];
}

/** True when `login` is listed in `ADMIN_LOGINS`. Empty allowlist → nobody. */
export function isAdminLogin(login: string, envRaw?: string): boolean {
  const allowed = parseAdminLogins(envRaw);
  if (allowed.length === 0) return false;
  return allowed.includes(normalizeLogin(login));
}
