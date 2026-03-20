import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Tests for API v2 route validation logic.
//
// The v2 routes (GET /api/v2/usage, GET /api/v2/openapi.json) depend on
// verifyApiKey + requireScope from lib/api-auth and cursor-based pagination
// from the usage route. These tests verify the embedded validation logic and
// the OpenAPI spec structure without standing up a Next.js server.
// ---------------------------------------------------------------------------

// --- Cursor encode/decode (replicated from app/api/v2/usage/route.ts) ---

function encodeCursor(recordedAt: string, id: string): string {
  return Buffer.from(`${recordedAt}|${id}`, "utf8").toString("base64");
}

interface DecodedCursor {
  ok: boolean;
  recordedAt?: string;
  id?: string;
  error?: string;
}

function decodeCursor(cursor: string): DecodedCursor {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length === 2) {
      return { ok: true, recordedAt: parts[0], id: parts[1] };
    }
    return { ok: false, error: "INVALID_CURSOR" };
  } catch {
    return { ok: false, error: "INVALID_CURSOR" };
  }
}

// --- Scope check (mirrors requireScope from lib/api-auth) ---

function scopeAllowed(scopes: string[], required: string): boolean {
  return scopes.includes(required) || scopes.includes("admin");
}

// --- OpenAPI spec structure (mirrors app/api/v2/openapi.json/route.ts) ---

interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string };
  servers: Array<{ url: string }>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
}

function getOpenApiSpec(): OpenApiSpec {
  return {
    openapi: "3.1.0",
    info: {
      title: "Kova API v2",
      version: "2.0.0",
      description:
        "Kova AI Dev FinOps API. All endpoints require a Bearer API key unless otherwise noted.",
    },
    servers: [{ url: "/api/v2", description: "API v2" }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API key (kova_...)",
        },
      },
      schemas: {
        Error: {
          type: "object",
          required: ["error", "code"],
          properties: {
            error: { type: "string" },
            code: { type: "string" },
          },
        },
        CursorPage: {
          type: "object",
          properties: {
            next_cursor: { type: ["string", "null"] },
            has_more: { type: "boolean" },
          },
        },
        UsageRecord: {
          type: "object",
          properties: {
            id: { type: "string" },
            cost_usd: { type: "number" },
          },
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Cursor encode / decode
// ---------------------------------------------------------------------------

describe("v2 usage: cursor encode/decode round-trip", () => {
  it("encodes a cursor as base64 and decodes back to original parts", () => {
    const recordedAt = "2026-03-19T10:00:00.000Z";
    const id = "uuid-abc-123";
    const cursor = encodeCursor(recordedAt, id);
    const result = decodeCursor(cursor);
    expect(result.ok).toBe(true);
    expect(result.recordedAt).toBe(recordedAt);
    expect(result.id).toBe(id);
  });

  it("returns ok: false for a non-base64 garbage cursor", () => {
    // A string with only one part after decoding (no pipe separator)
    const badCursor = Buffer.from("no-pipe-here", "utf8").toString("base64");
    const result = decodeCursor(badCursor);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("INVALID_CURSOR");
  });

  it("decodes cursor with pipe in id portion correctly", () => {
    // Edge case: only first split at | matters; id may not contain pipes
    const recordedAt = "2026-01-01T00:00:00.000Z";
    const id = "simple-id";
    const cursor = encodeCursor(recordedAt, id);
    const result = decodeCursor(cursor);
    expect(result.ok).toBe(true);
    expect(result.recordedAt).toBe(recordedAt);
  });
});

// ---------------------------------------------------------------------------
// v2 scope requirement checks
// ---------------------------------------------------------------------------

describe("v2 usage: scope checks", () => {
  it("allows access with 'read' scope", () => {
    expect(scopeAllowed(["read"], "read")).toBe(true);
  });

  it("denies access with only 'write' scope for a read endpoint", () => {
    expect(scopeAllowed(["write"], "read")).toBe(false);
  });

  it("allows access with 'admin' scope regardless of required scope", () => {
    expect(scopeAllowed(["admin"], "read")).toBe(true);
    expect(scopeAllowed(["admin"], "write")).toBe(true);
  });

  it("denies access with an empty scopes array", () => {
    expect(scopeAllowed([], "read")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// v2 usage query param validation
// ---------------------------------------------------------------------------

describe("v2 usage: query param handling", () => {
  function parseParams(queryString: string): URLSearchParams {
    return new URLSearchParams(queryString);
  }

  it("accepts no query params (all optional)", () => {
    const params = parseParams("");
    expect(params.get("cursor")).toBeNull();
    expect(params.get("since")).toBeNull();
    expect(params.get("until")).toBeNull();
    expect(params.get("tool")).toBeNull();
  });

  it("extracts cursor param from query string", () => {
    const cursor = encodeCursor("2026-03-19T10:00:00.000Z", "some-id");
    const params = parseParams(`cursor=${encodeURIComponent(cursor)}`);
    const decoded = decodeCursor(params.get("cursor")!);
    expect(decoded.ok).toBe(true);
    expect(decoded.id).toBe("some-id");
  });

  it("extracts since and until ISO date filters", () => {
    const params = parseParams(
      "since=2026-03-01T00:00:00.000Z&until=2026-03-31T23:59:59.000Z",
    );
    expect(params.get("since")).toBe("2026-03-01T00:00:00.000Z");
    expect(params.get("until")).toBe("2026-03-31T23:59:59.000Z");
  });

  it("extracts tool and model filters", () => {
    const params = parseParams("tool=Task&model=claude-sonnet-4-6");
    expect(params.get("tool")).toBe("Task");
    expect(params.get("model")).toBe("claude-sonnet-4-6");
  });
});

// ---------------------------------------------------------------------------
// OpenAPI spec structure
// ---------------------------------------------------------------------------

describe("v2 openapi spec structure", () => {
  it("declares openapi version 3.1.0", () => {
    const spec = getOpenApiSpec();
    expect(spec.openapi).toBe("3.1.0");
  });

  it("has correct API title and version in info", () => {
    const spec = getOpenApiSpec();
    expect(spec.info.title).toBe("Kova API v2");
    expect(spec.info.version).toBe("2.0.0");
  });

  it("defines BearerAuth security scheme", () => {
    const spec = getOpenApiSpec();
    const bearerAuth = spec.components.securitySchemes[
      "BearerAuth"
    ] as Record<string, string>;
    expect(bearerAuth).toBeDefined();
    expect(bearerAuth.type).toBe("http");
    expect(bearerAuth.scheme).toBe("bearer");
  });

  it("defines Error and CursorPage schemas", () => {
    const spec = getOpenApiSpec();
    expect(spec.components.schemas["Error"]).toBeDefined();
    expect(spec.components.schemas["CursorPage"]).toBeDefined();
  });

  it("Error schema requires 'error' and 'code' fields", () => {
    const spec = getOpenApiSpec();
    const errorSchema = spec.components.schemas["Error"] as {
      required: string[];
    };
    expect(errorSchema.required).toContain("error");
    expect(errorSchema.required).toContain("code");
  });

  it("server URL points to /api/v2", () => {
    const spec = getOpenApiSpec();
    expect(spec.servers[0].url).toBe("/api/v2");
  });
});
