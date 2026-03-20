"use client";

import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface WebhookDelivery {
  id: string;
  created_at: string;
  event_type: string;
  status: "delivered" | "pending" | "failed";
  response_code: number | null;
  latency_ms: number | null;
  endpoint_id: string;
}

interface WebhookDeliveryLogProps {
  deliveries: WebhookDelivery[];
  onRetry?: (deliveryId: string) => Promise<void>;
}

function StatusBadge({ status }: { status: WebhookDelivery["status"] }) {
  const styles = {
    delivered: "bg-green-900/30 text-green-400",
    pending: "bg-amber-900/30 text-amber-400",
    failed: "bg-red-900/30 text-red-400",
  };
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

export function WebhookDeliveryLog({
  deliveries,
  onRetry,
}: WebhookDeliveryLogProps) {
  const [retrying, setRetrying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry(deliveryId: string) {
    if (!onRetry) return;
    setRetrying(deliveryId);
    setError(null);
    try {
      await onRetry(deliveryId);
    } catch {
      setError("Retry failed. Please try again.");
    } finally {
      setRetrying(null);
    }
  }

  if (deliveries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-kova-silver-dim text-sm">
          No delivery attempts yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-kova-silver-dim uppercase border-b border-kova-border">
              <th className="pb-3 pr-4">Timestamp</th>
              <th className="pb-3 pr-4">Event</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Response</th>
              <th className="pb-3 pr-4">Latency</th>
              {onRetry && <th className="pb-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <tr
                key={delivery.id}
                className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/40 transition-colors"
              >
                <td className="py-3 pr-4 text-kova-silver-dim text-sm whitespace-nowrap">
                  {format(new Date(delivery.created_at), "MMM d, HH:mm:ss")}
                </td>
                <td className="py-3 pr-4 text-kova-silver text-sm font-mono">
                  {delivery.event_type}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={delivery.status} />
                </td>
                <td className="py-3 pr-4 text-kova-silver-dim text-sm">
                  {delivery.response_code ?? "—"}
                </td>
                <td className="py-3 pr-4 text-kova-silver-dim text-sm">
                  {delivery.latency_ms != null
                    ? `${delivery.latency_ms}ms`
                    : "—"}
                </td>
                {onRetry && (
                  <td className="py-3">
                    <button
                      onClick={() => handleRetry(delivery.id)}
                      disabled={retrying === delivery.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-kova-charcoal-light border border-kova-border text-kova-silver rounded-lg hover:border-kova-blue/50 hover:text-white disabled:opacity-40 transition-colors"
                      title="Retry delivery"
                    >
                      <RefreshCw
                        size={11}
                        className={
                          retrying === delivery.id ? "animate-spin" : ""
                        }
                      />
                      Retry
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
