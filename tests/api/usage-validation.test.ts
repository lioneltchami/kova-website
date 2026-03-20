import { describe, expect, it } from "vitest";

// Tests for the validation rules enforced by POST /api/v1/usage (route.ts).
// The route embeds validation directly rather than exporting utility functions,
// so these tests replicate the exact validation logic to verify correctness of
// the rules and document expected behavior without spinning up a Next.js server.
//
// Integration / E2E tests in tests/e2e/api-auth.spec.ts cover the full HTTP layer.

// --- Replication of validation logic from route.ts ---

const MAX_RECORDS = 500;

interface AuthCheckResult {
  ok: boolean;
  code?: string;
}

function checkBearerAuth(authHeader: string | null): AuthCheckResult {
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, code: "MISSING_AUTH" };
  }
  return { ok: true };
}

interface RecordsValidationResult {
  ok: boolean;
  code?: string;
  status?: number;
}

function validateRecords(records: unknown): RecordsValidationResult {
  if (!Array.isArray(records) || records.length === 0) {
    return { ok: false, code: "NO_RECORDS", status: 400 };
  }
  if (records.length > MAX_RECORDS) {
    return { ok: false, code: "TOO_MANY_RECORDS", status: 400 };
  }
  return { ok: true };
}

interface UsageRecord {
  id: string;
  tool: string;
  model?: string;
  session_id?: string;
  project?: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  timestamp: string;
  duration_ms?: number;
  cli_version?: string;
}

function isValidUsageRecord(record: unknown): record is UsageRecord {
  if (typeof record !== "object" || record === null) return false;
  const r = record as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.tool === "string" &&
    typeof r.input_tokens === "number" &&
    typeof r.output_tokens === "number" &&
    typeof r.cost_usd === "number" &&
    typeof r.timestamp === "string"
  );
}

// --- Tests ---

describe("usage route: auth header validation", () => {
  it("rejects a missing auth header", () => {
    const result = checkBearerAuth(null);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("MISSING_AUTH");
  });

  it("rejects an auth header without Bearer prefix", () => {
    const result = checkBearerAuth("Token abc123");
    expect(result.ok).toBe(false);
    expect(result.code).toBe("MISSING_AUTH");
  });

  it("rejects an empty auth header", () => {
    const result = checkBearerAuth("");
    expect(result.ok).toBe(false);
    expect(result.code).toBe("MISSING_AUTH");
  });

  it("accepts a valid Bearer token header", () => {
    const result = checkBearerAuth("Bearer kova_abc123xyz");
    expect(result.ok).toBe(true);
  });
});

describe("usage route: records array validation", () => {
  it("rejects an empty records array", () => {
    const result = validateRecords([]);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("NO_RECORDS");
    expect(result.status).toBe(400);
  });

  it("rejects a non-array records value", () => {
    const result = validateRecords("not an array");
    expect(result.ok).toBe(false);
    expect(result.code).toBe("NO_RECORDS");
  });

  it("rejects a null records value", () => {
    const result = validateRecords(null);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("NO_RECORDS");
  });

  it("rejects more than 500 records", () => {
    const records = Array.from({ length: 501 }, (_, i) => ({ id: `r${i}` }));
    const result = validateRecords(records);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("TOO_MANY_RECORDS");
    expect(result.status).toBe(400);
  });

  it("accepts exactly 500 records", () => {
    const records = Array.from({ length: 500 }, (_, i) => ({ id: `r${i}` }));
    const result = validateRecords(records);
    expect(result.ok).toBe(true);
  });

  it("accepts a single valid record", () => {
    const result = validateRecords([{ id: "rec-1" }]);
    expect(result.ok).toBe(true);
  });
});

describe("usage route: valid payload shape", () => {
  it("accepts a fully-specified valid usage record", () => {
    const record: unknown = {
      id: "idempotency-key-abc123",
      tool: "Task",
      model: "claude-sonnet-4-6",
      session_id: "sess-xyz",
      project: "kova-website",
      input_tokens: 1500,
      output_tokens: 300,
      cost_usd: 0.0042,
      timestamp: "2026-03-19T10:00:00.000Z",
      duration_ms: 2300,
      cli_version: "0.3.0",
    };
    expect(isValidUsageRecord(record)).toBe(true);
  });

  it("accepts a minimal valid usage record (required fields only)", () => {
    const record: unknown = {
      id: "minimal-key",
      tool: "Edit",
      input_tokens: 100,
      output_tokens: 50,
      cost_usd: 0.001,
      timestamp: "2026-03-19T10:00:00.000Z",
    };
    expect(isValidUsageRecord(record)).toBe(true);
  });

  it("rejects a record missing the id field", () => {
    const record: unknown = {
      tool: "Bash",
      input_tokens: 100,
      output_tokens: 50,
      cost_usd: 0.001,
      timestamp: "2026-03-19T10:00:00.000Z",
    };
    expect(isValidUsageRecord(record)).toBe(false);
  });

  it("rejects a record with non-numeric cost_usd", () => {
    const record: unknown = {
      id: "key-1",
      tool: "Read",
      input_tokens: 100,
      output_tokens: 50,
      cost_usd: "0.001",
      timestamp: "2026-03-19T10:00:00.000Z",
    };
    expect(isValidUsageRecord(record)).toBe(false);
  });
});
