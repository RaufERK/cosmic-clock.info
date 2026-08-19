/**
 * JWT `iat` is second-precision. Compare on whole seconds so a session
 * re-issued in the same second as the password change stays valid.
 */
export function isJwtInvalidatedByPasswordChange(
  tokenIatSec: number | undefined,
  passwordChangedAt: Date | null | undefined,
): boolean {
  if (!passwordChangedAt) return false;
  if (typeof tokenIatSec !== "number") return true;
  return tokenIatSec < Math.floor(passwordChangedAt.getTime() / 1000);
}
