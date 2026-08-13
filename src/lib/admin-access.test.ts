import { describe, expect, it } from "vitest";
import { isAdminLogin, parseAdminLogins } from "@/lib/admin-access";

describe("parseAdminLogins", () => {
  it("returns empty for missing or blank env", () => {
    expect(parseAdminLogins(undefined)).toEqual([]);
    expect(parseAdminLogins("")).toEqual([]);
    expect(parseAdminLogins("  ,  ")).toEqual([]);
  });

  it("normalizes case, trim, and commas", () => {
    expect(parseAdminLogins("Rauf")).toEqual(["rauf"]);
    expect(parseAdminLogins(" Rauf , Other ")).toEqual(["rauf", "other"]);
  });

  it("dedupes after normalize", () => {
    expect(parseAdminLogins("Rauf,rauf, RAUF")).toEqual(["rauf"]);
  });
});

describe("isAdminLogin", () => {
  it("fails closed when allowlist is empty", () => {
    expect(isAdminLogin("rauf", undefined)).toBe(false);
    expect(isAdminLogin("rauf", "")).toBe(false);
  });

  it("matches the production login regardless of stored case", () => {
    expect(isAdminLogin("Rauf", "Rauf")).toBe(true);
    expect(isAdminLogin("rauf", "Rauf")).toBe(true);
    expect(isAdminLogin("alice", "Rauf")).toBe(false);
  });
});
