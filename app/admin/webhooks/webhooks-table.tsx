"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FailedDelivery {
  id: string;
  endpointId: string;
  endpointUrl: string;
  teamName: string;
  eventType: string;
  attemptCount: number;
  lastResponseCode: number | null;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface AdminWebhooksTableProps {
  deliveries: FailedDelivery[];
}

export function AdminWebhooksTable({ deliveries }: AdminWebhooksTableProps) {
  const router = useRouter();
  const [replaying, setReplaying] = useState<Set<string>>(new Set());

  async function handleReplay(deliveryId: string) {
    setReplaying((prev) => new Set(prev).add(deliveryId));
    try {
      const res = await fetch("/api/admin/webhooks/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        router.refresh();
      } else {
        alert("Replay failed: " + (data.error ?? "Unknown error"));
      }
    } catch {
      alert("Request failed");
    } finally {
      setReplaying((prev) => {
        const next = new Set(prev);
        next.delete(deliveryId);
        return next;
      });
    }
  }

  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-kova-silver-dim uppercase tracking-wider border-b border-kova-border bg-kova-charcoal-light/30">
              <th className="px-4 py-3 font-medium">Team</th>
              <th className="px-4 py-3 font-medium">Endpoint</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Attempts</th>
              <th className="px-4 py-3 font-medium">Last Status</th>
              <th className="px-4 py-3 font-medium">Failed At</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-kova-silver-dim"
                >
                  No failed deliveries
                </td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-kova-silver font-medium">
                    {d.teamName}
                  </td>
                  <td className="px-4 py-3 text-sm text-kova-silver-dim font-mono max-w-[200px] truncate">
                    {d.endpointUrl}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-kova-charcoal-light text-kova-silver px-1.5 py-0.5 rounded">
                      {d.eventType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-kova-silver-dim tabular-nums">
                    {d.attemptCount}
                  </td>
                  <td className="px-4 py-3">
                    {d.lastResponseCode !== null ? (
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          d.lastResponseCode >= 500
                            ? "text-red-400"
                            : d.lastResponseCode >= 400
                              ? "text-amber-400"
                              : "text-kova-silver-dim"
                        }`}
                      >
                        {d.lastResponseCode}
                      </span>
                    ) : (
                      <span className="text-xs text-kova-silver-dim">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-kova-silver-dim">
                    {formatDate(d.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleReplay(d.id)}
                      disabled={replaying.has(d.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-kova-blue hover:text-kova-blue-light transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw
                        size={11}
                        className={replaying.has(d.id) ? "animate-spin" : ""}
                      />
                      Replay
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-kova-border/50 text-xs text-kova-silver-dim">
        {deliveries.length} failed deliver
        {deliveries.length !== 1 ? "ies" : "y"} (max 200)
      </div>
    </div>
  );
}
