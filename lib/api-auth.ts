import type { NextRequest } from "next/server";
import { createAdminClient } from "./supabase-admin";

export interface ApiKeyContext {
  userId: string;
  teamId: string;
  plan: string;
  scopes: string[];
  keyPrefix: string;
}

export async function verifyApiKey(
  request: NextRequest,
): Promise<ApiKeyContext | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const apiKey = auth.slice(7);
  const admin = createAdminClient();

  // verify_api_key returns: (valid, account_id, account_email, account_plan)
  const { data, error } = await admin.rpc("verify_api_key", { p_key: apiKey });
  if (error || !data || data.length === 0 || !data[0].valid) return null;

  const row = data[0] as {
    valid: boolean;
    account_id: string;
    account_email: string;
    account_plan: string;
  };

  // Fetch scopes from private.api_keys (added in migration 007)
  const keyPrefix = apiKey.slice(0, 8);
  const { data: keyRow } = await admin
    .schema("private")
    .from("api_keys")
    .select("scopes")
    .eq("key_prefix", keyPrefix)
    .eq("is_active", true)
    .maybeSingle();

  const scopes: string[] = (keyRow as { scopes?: string[] } | null)?.scopes ?? [
    "read",
    "write",
  ];

  // Resolve the user's primary team
  const { data: membership } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", row.account_id)
    .limit(1)
    .maybeSingle();

  return {
    userId: row.account_id,
    teamId: membership?.team_id ?? "",
    plan: row.account_plan ?? "free",
    scopes,
    keyPrefix,
  };
}

export function requireScope(context: ApiKeyContext, scope: string): boolean {
  return context.scopes.includes(scope) || context.scopes.includes("admin");
}
