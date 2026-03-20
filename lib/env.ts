/**
 * Environment variable utilities.
 *
 * Use requireEnv() for variables consumed at request-time (e.g. inside route handlers
 * or server actions). This throws a clear error immediately rather than producing
 * undefined-related failures deeper in the call stack.
 *
 * Call validateRequiredEnvVars() from a top-level initializer (e.g. instrumentation.ts)
 * to surface missing config at startup instead of at first request.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`Required environment variable ${name} is not set`);
  return value;
}

export function validateRequiredEnvVars(): void {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}
