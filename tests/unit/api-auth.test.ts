import { describe, expect, it } from "vitest";
import { requireScope } from "@/lib/api-auth";
import type { ApiKeyContext } from "@/lib/api-auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(scopes: string[]): ApiKeyContext {
  return {
    userId: "user-1",
    teamId: "team-1",
    plan: "pro",
    scopes,
    keyPrefix: "kova_abc",
  };
}

// ---------------------------------------------------------------------------
// requireScope
// ---------------------------------------------------------------------------

describe("requireScope: direct scope match", () => {
  it("returns true when the exact scope is present", () => {
    const ctx = makeCtx(["read", "write"]);
    expect(requireScope(ctx, "read")).toBe(true);
    expect(requireScope(ctx, "write")).toBe(true);
  });

  it("returns false when the required scope is absent", () => {
    const ctx = makeCtx(["read"]);
    expect(requireScope(ctx, "write")).toBe(false);
  });

  it("returns false for an empty scopes array", () => {
    const ctx = makeCtx([]);
    expect(requireScope(ctx, "read")).toBe(false);
  });
});

describe("requireScope: admin bypass", () => {
  it("returns true for any scope when admin is present", () => {
    const ctx = makeCtx(["admin"]);
    expect(requireScope(ctx, "read")).toBe(true);
    expect(requireScope(ctx, "write")).toBe(true);
    expect(requireScope(ctx, "delete")).toBe(true);
    expect(requireScope(ctx, "some-future-scope")).toBe(true);
  });

  it("admin scope alongside other scopes still grants access", () => {
    const ctx = makeCtx(["read", "admin"]);
    expect(requireScope(ctx, "write")).toBe(true);
  });
});

describe("requireScope: scope isolation", () => {
  it("write-only key cannot satisfy read requirement", () => {
    const ctx = makeCtx(["write"]);
    expect(requireScope(ctx, "read")).toBe(false);
  });

  it("read-only key cannot satisfy write requirement", () => {
    const ctx = makeCtx(["read"]);
    expect(requireScope(ctx, "write")).toBe(false);
  });

  it("unrelated custom scopes do not satisfy standard scopes", () => {
    const ctx = makeCtx(["export", "webhook"]);
    expect(requireScope(ctx, "read")).toBe(false);
    expect(requireScope(ctx, "write")).toBe(false);
  });
});

describe("requireScope: case sensitivity", () => {
  it("scope matching is case-sensitive", () => {
    const ctx = makeCtx(["Read", "WRITE"]);
    // Lowercase 'read' must not match 'Read'
    expect(requireScope(ctx, "read")).toBe(false);
    expect(requireScope(ctx, "write")).toBe(false);
  });
});
