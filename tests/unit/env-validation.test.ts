import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { requireEnv, validateRequiredEnvVars } from "@/lib/env";

// ---------------------------------------------------------------------------
// requireEnv
// ---------------------------------------------------------------------------

describe("requireEnv: present variable", () => {
  const VAR_NAME = "TEST_ENV_VAR_PRESENT";

  beforeEach(() => {
    process.env[VAR_NAME] = "hello-world";
  });

  afterEach(() => {
    delete process.env[VAR_NAME];
  });

  it("returns the value when the variable is set", () => {
    expect(requireEnv(VAR_NAME)).toBe("hello-world");
  });

  it("returns the exact string value without trimming or transformation", () => {
    process.env[VAR_NAME] = "  spaced  ";
    expect(requireEnv(VAR_NAME)).toBe("  spaced  ");
  });
});

describe("requireEnv: missing variable", () => {
  const VAR_NAME = "TEST_ENV_VAR_MISSING_XYZ";

  beforeEach(() => {
    delete process.env[VAR_NAME];
  });

  it("throws when the variable is not set", () => {
    expect(() => requireEnv(VAR_NAME)).toThrow(VAR_NAME);
  });

  it("throws an Error with a descriptive message", () => {
    expect(() => requireEnv(VAR_NAME)).toThrowError(
      /Required environment variable/i,
    );
  });
});

// ---------------------------------------------------------------------------
// validateRequiredEnvVars
// ---------------------------------------------------------------------------

describe("validateRequiredEnvVars", () => {
  const REQUIRED = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Save current state
    for (const name of REQUIRED) {
      original[name] = process.env[name];
    }
  });

  afterEach(() => {
    // Restore original state
    for (const name of REQUIRED) {
      if (original[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = original[name];
      }
    }
  });

  it("does not throw when all required vars are present", () => {
    for (const name of REQUIRED) {
      process.env[name] = "some-value";
    }
    expect(() => validateRequiredEnvVars()).not.toThrow();
  });

  it("throws when any required var is missing", () => {
    for (const name of REQUIRED) {
      process.env[name] = "set";
    }
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    expect(() => validateRequiredEnvVars()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("lists all missing variable names in the error message", () => {
    for (const name of REQUIRED) {
      delete process.env[name];
    }
    let message = "";
    try {
      validateRequiredEnvVars();
    } catch (err) {
      message = (err as Error).message;
    }
    for (const name of REQUIRED) {
      expect(message).toContain(name);
    }
  });
});
