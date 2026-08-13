/** Normalize login for storage and lookup (trim + lowercase). */
export function normalizeLogin(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidLoginFormat(login: string): boolean {
  return login.length >= 1 && login.length <= 64;
}
