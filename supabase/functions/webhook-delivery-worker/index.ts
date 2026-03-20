/**
 * Supabase Edge Function: webhook-delivery-worker
 *
 * Processes pending webhook deliveries from the webhook_deliveries table.
 * For each pending delivery it:
 *   1. Fetches the target endpoint URL and signing secret.
 *   2. Computes an HMAC-SHA256 signature over the JSON payload.
 *   3. POSTs the payload to the endpoint with the signature header.
 *   4. Marks the delivery as 'delivered' on HTTP 2xx, or increments
 *      attempt_count and schedules the next retry with exponential backoff.
 *      After 5 failed attempts the delivery is marked 'failed'.
 *
 * Cron schedule: every minute or on-demand via HTTP trigger.
 *   [functions.webhook-delivery-worker]
 *   schedule = "* * * * *"
 *
 * Backoff formula: min(2^attempt * 30, 3600) seconds.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 50;

function computeBackoffSeconds(attempt: number): number {
  const backoff = 2 ** attempt * 30;
  return Math.min(backoff, 3600);
}

async function computeHmacSignature(
  secret: string,
  body: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(body);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const signatureBytes = new Uint8Array(signatureBuffer);
  return Array.from(signatureBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (_req: Request): Promise<Response> => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch pending deliveries that are ready to attempt (next_attempt_at is past)
  const { data: deliveries, error: fetchError } = await supabase
    .from("webhook_deliveries")
    .select(
      `
      id,
      event_type,
      payload,
      attempt_count,
      endpoint_id,
      webhook_endpoints!inner (
        url,
        signing_secret,
        is_active
      )
    `,
    )
    .eq("status", "pending")
    .or("next_attempt_at.is.null,next_attempt_at.lte.now()")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error("Failed to fetch pending deliveries:", fetchError.message);
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!deliveries || deliveries.length === 0) {
    return new Response(
      JSON.stringify({ processed: 0, message: "No pending deliveries" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  let successCount = 0;
  let failCount = 0;

  for (const delivery of deliveries) {
    const endpoint = delivery.webhook_endpoints as {
      url: string;
      signing_secret: string;
      is_active: boolean;
    };

    // Skip if endpoint has been deactivated since the delivery was queued
    if (!endpoint?.is_active) {
      await supabase
        .from("webhook_deliveries")
        .update({
          status: "failed",
          last_response_body: "Endpoint deactivated",
        })
        .eq("id", delivery.id);
      failCount++;
      continue;
    }

    const payloadStr = JSON.stringify(delivery.payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // Signature covers timestamp + payload to prevent replay attacks
    const signaturePayload = `${timestamp}.${payloadStr}`;

    let signature: string;
    try {
      signature = await computeHmacSignature(
        endpoint.signing_secret,
        signaturePayload,
      );
    } catch (err) {
      console.error(
        `HMAC computation failed for delivery ${delivery.id}:`,
        err,
      );
      failCount++;
      continue;
    }

    let responseCode: number | null = null;
    let responseBody: string | null = null;
    let deliverySucceeded = false;

    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kova-Event": delivery.event_type,
          "X-Kova-Timestamp": timestamp,
          "X-Kova-Signature": `sha256=${signature}`,
        },
        body: payloadStr,
        signal: AbortSignal.timeout(10_000), // 10 second timeout
      });

      responseCode = response.status;
      // Read at most 1KB of response body to avoid memory issues
      const bodyText = await response.text();
      responseBody = bodyText.slice(0, 1024);
      deliverySucceeded = response.ok;
    } catch (err) {
      responseBody = err instanceof Error ? err.message : String(err);
      console.error(
        `Delivery request failed for ${delivery.id}:`,
        responseBody,
      );
    }

    if (deliverySucceeded) {
      await supabase
        .from("webhook_deliveries")
        .update({
          status: "delivered",
          last_response_code: responseCode,
          last_response_body: responseBody,
          attempt_count: delivery.attempt_count + 1,
        })
        .eq("id", delivery.id);
      successCount++;
    } else {
      const newAttemptCount = delivery.attempt_count + 1;

      if (newAttemptCount >= MAX_ATTEMPTS) {
        await supabase
          .from("webhook_deliveries")
          .update({
            status: "failed",
            attempt_count: newAttemptCount,
            last_response_code: responseCode,
            last_response_body: responseBody,
          })
          .eq("id", delivery.id);
      } else {
        const backoffSeconds = computeBackoffSeconds(newAttemptCount);
        const nextAttemptAt = new Date(
          Date.now() + backoffSeconds * 1000,
        ).toISOString();

        await supabase
          .from("webhook_deliveries")
          .update({
            attempt_count: newAttemptCount,
            next_attempt_at: nextAttemptAt,
            last_response_code: responseCode,
            last_response_body: responseBody,
          })
          .eq("id", delivery.id);
      }
      failCount++;
    }
  }

  console.log(
    `Webhook delivery worker: processed ${deliveries.length}, succeeded ${successCount}, failed ${failCount}`,
  );

  return new Response(
    JSON.stringify({
      processed: deliveries.length,
      succeeded: successCount,
      failed: failCount,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
