import { describe, expect, it } from "vitest";

// Tests for the validation rules enforced by POST /api/v1/budget (route.ts).
// The route embeds validation directly rather than exporting utility functions,
// so these tests replicate the exact validation logic to verify correctness of
// the rules and document expected behavior.
//
// See also tests/e2e/api-auth.spec.ts for full HTTP-layer auth gating.

// --- Replication of validation logic from budget route.ts ---

type BudgetScope = "personal" | "team";
type BudgetPeriod = "daily" | "monthly";

interface BudgetPayload {
  scope?: unknown;
  period?: unknown;
  amount_usd?: unknown;
  warn_at_percent?: unknown;
  team_id?: unknown;
}

interface ValidationResult {
  ok: boolean;
  error?: string;
  status?: number;
}

function validateBudgetPayload(payload: BudgetPayload): ValidationResult {
  const { scope, period, amount_usd, warn_at_percent, team_id } = payload;

  if (!scope || !["personal", "team"].includes(scope as string)) {
    return {
      ok: false,
      error: "Invalid scope: must be 'personal' or 'team'",
      status: 400,
    };
  }

  if (!period || !["daily", "monthly"].includes(period as string)) {
    return {
      ok: false,
      error: "Invalid period: must be 'daily' or 'monthly'",
      status: 400,
    };
  }

  if (typeof amount_usd !== "number" || amount_usd <= 0) {
    return {
      ok: false,
      error: "amount_usd must be a positive number",
      status: 400,
    };
  }

  if (scope === "team" && !team_id) {
    return {
      ok: false,
      error: "team_id is required for team-scoped budgets",
      status: 400,
    };
  }

  // warn_at_percent is optional; when provided it should be between 1 and 100
  if (warn_at_percent !== undefined) {
    if (
      typeof warn_at_percent !== "number" ||
      warn_at_percent < 1 ||
      warn_at_percent > 100
    ) {
      return {
        ok: false,
        error: "warn_at_percent must be a number between 1 and 100",
        status: 400,
      };
    }
  }

  return { ok: true };
}

// --- Tests ---

describe("budget route: valid budget creation", () => {
  it("accepts a valid personal daily budget", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
      amount_usd: 5.0,
    });
    expect(result.ok).toBe(true);
  });

  it("accepts a valid team monthly budget with team_id", () => {
    const result = validateBudgetPayload({
      scope: "team",
      period: "monthly",
      amount_usd: 100,
      team_id: "team-uuid-abc",
    });
    expect(result.ok).toBe(true);
  });

  it("accepts a budget with explicit warn_at_percent", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "monthly",
      amount_usd: 50,
      warn_at_percent: 75,
    });
    expect(result.ok).toBe(true);
  });
});

describe("budget route: scope validation", () => {
  it("rejects an invalid scope value", () => {
    const result = validateBudgetPayload({
      scope: "organization",
      period: "daily",
      amount_usd: 10,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/invalid scope/i);
    expect(result.status).toBe(400);
  });

  it("rejects a missing scope", () => {
    const result = validateBudgetPayload({
      period: "daily",
      amount_usd: 10,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/invalid scope/i);
  });

  it("rejects an empty string scope", () => {
    const result = validateBudgetPayload({
      scope: "",
      period: "daily",
      amount_usd: 10,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a team scope without team_id", () => {
    const result = validateBudgetPayload({
      scope: "team",
      period: "monthly",
      amount_usd: 50,
      // team_id intentionally omitted
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/team_id/i);
    expect(result.status).toBe(400);
  });
});

describe("budget route: period validation", () => {
  it("rejects an invalid period value", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "weekly",
      amount_usd: 10,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/invalid period/i);
    expect(result.status).toBe(400);
  });

  it("rejects a missing period", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      amount_usd: 10,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/invalid period/i);
  });
});

describe("budget route: amount_usd validation", () => {
  it("rejects a negative amount", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
      amount_usd: -5,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/positive number/i);
    expect(result.status).toBe(400);
  });

  it("rejects zero as an amount", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
      amount_usd: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/positive number/i);
  });

  it("rejects a string amount", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
      amount_usd: "10",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/positive number/i);
  });

  it("rejects a missing amount_usd", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/positive number/i);
  });

  it("accepts a fractional amount (e.g. $0.50)", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
      amount_usd: 0.5,
    });
    expect(result.ok).toBe(true);
  });
});

describe("budget route: warn_at_percent validation", () => {
  it("rejects warn_at_percent below 1", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
      amount_usd: 10,
      warn_at_percent: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/warn_at_percent/i);
    expect(result.status).toBe(400);
  });

  it("rejects warn_at_percent above 100", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
      amount_usd: 10,
      warn_at_percent: 101,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/warn_at_percent/i);
    expect(result.status).toBe(400);
  });

  it("rejects a non-numeric warn_at_percent", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
      amount_usd: 10,
      warn_at_percent: "80",
    });
    expect(result.ok).toBe(false);
  });

  it("accepts boundary value warn_at_percent of 1", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
      amount_usd: 10,
      warn_at_percent: 1,
    });
    expect(result.ok).toBe(true);
  });

  it("accepts boundary value warn_at_percent of 100", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
      amount_usd: 10,
      warn_at_percent: 100,
    });
    expect(result.ok).toBe(true);
  });

  it("accepts missing warn_at_percent (optional field)", () => {
    const result = validateBudgetPayload({
      scope: "personal",
      period: "daily",
      amount_usd: 10,
    });
    expect(result.ok).toBe(true);
  });
});
