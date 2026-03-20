"use client";

import { ChevronDown, ChevronUp, Globe, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  type WebhookDelivery,
  WebhookDeliveryLog,
} from "@/components/dashboard/webhook-delivery-log";

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_delivery_at: string | null;
}

const AVAILABLE_EVENTS = [
  "usage.synced",
  "budget.warning",
  "budget.exceeded",
  "member.invited",
  "member.removed",
  "api_key.created",
  "api_key.revoked",
];

function EndpointCard({
  endpoint,
  onDelete,
}: {
  endpoint: WebhookEndpoint;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadDeliveries() {
    if (deliveries.length > 0) return;
    setLoadingDeliveries(true);
    try {
      const res = await fetch(`/api/v2/webhooks/${endpoint.id}/deliveries`);
      if (res.ok) {
        const data = (await res.json()) as WebhookDelivery[];
        setDeliveries(data);
      }
    } finally {
      setLoadingDeliveries(false);
    }
  }

  async function handleToggle() {
    if (!expanded) {
      await loadDeliveries();
    }
    setExpanded((v) => !v);
  }

  async function handleDelete() {
    if (!confirm("Remove this webhook endpoint?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/v2/webhooks/${endpoint.id}`, { method: "DELETE" });
      onDelete(endpoint.id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleRetry(deliveryId: string) {
    await fetch(
      `/api/v2/webhooks/${endpoint.id}/deliveries/${deliveryId}/retry`,
      { method: "POST" },
    );
    await loadDeliveries();
  }

  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-8 h-8 rounded-full bg-kova-blue/10 border border-kova-blue/30 flex items-center justify-center flex-shrink-0">
          <Globe size={14} className="text-kova-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {endpoint.url}
          </p>
          <p className="text-xs text-kova-silver-dim mt-0.5">
            {endpoint.events.length} event
            {endpoint.events.length !== 1 ? "s" : ""} subscribed
            {endpoint.last_delivery_at && (
              <span>
                {" "}
                &middot; last delivery{" "}
                {new Date(endpoint.last_delivery_at).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                  },
                )}
              </span>
            )}
          </p>
        </div>
        <span
          className={`flex-shrink-0 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
            endpoint.is_active
              ? "bg-green-900/30 text-green-400"
              : "bg-kova-charcoal-light text-kova-silver-dim"
          }`}
        >
          {endpoint.is_active ? "active" : "inactive"}
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-shrink-0 p-1.5 text-kova-silver-dim hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
          title="Delete endpoint"
        >
          <Trash2 size={13} />
        </button>
        <button
          onClick={handleToggle}
          className="flex-shrink-0 p-1.5 text-kova-silver-dim hover:text-kova-silver rounded-lg transition-colors"
          aria-label={expanded ? "Collapse" : "Expand delivery log"}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-kova-border px-5 py-4">
          <h4 className="text-xs text-kova-silver-dim uppercase tracking-wider mb-3">
            Delivery Log
          </h4>
          {loadingDeliveries ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-kova-charcoal-light rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <WebhookDeliveryLog deliveries={deliveries} onRetry={handleRetry} />
          )}
        </div>
      )}
    </div>
  );
}

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEndpoints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v2/webhooks");
      if (res.ok) {
        const data = (await res.json()) as WebhookEndpoint[];
        setEndpoints(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEndpoints();
  }, [loadEndpoints]);

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  async function handleAddEndpoint(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) {
      setError("URL is required.");
      return;
    }
    if (selectedEvents.length === 0) {
      setError("Select at least one event.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, events: selectedEvents }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to add webhook.");
      } else {
        setShowForm(false);
        setNewUrl("");
        setSelectedEvents([]);
        await loadEndpoints();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string) {
    setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhooks</h1>
          <p className="text-sm text-kova-silver-dim mt-0.5">
            Receive real-time notifications for workspace events
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors"
        >
          <Plus size={14} />
          Add Webhook
        </button>
      </div>

      {/* Add webhook form */}
      {showForm && (
        <form
          onSubmit={handleAddEndpoint}
          className="bg-kova-surface border border-kova-border rounded-xl p-5 mb-6"
        >
          <h2 className="text-base font-semibold text-white mb-4">
            New Webhook Endpoint
          </h2>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-900/20 border border-red-800/40 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs text-kova-silver-dim mb-1.5">
              Endpoint URL
            </label>
            <input
              type="url"
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full px-3 py-2 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver placeholder:text-kova-silver-dim/60 focus:outline-none focus:border-kova-blue transition-colors"
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs text-kova-silver-dim mb-2">
              Events to subscribe
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_EVENTS.map((event) => (
                <button
                  key={event}
                  type="button"
                  onClick={() => toggleEvent(event)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    selectedEvents.includes(event)
                      ? "bg-kova-blue/20 border-kova-blue/50 text-kova-blue"
                      : "bg-kova-charcoal-light border-kova-border text-kova-silver-dim hover:text-kova-silver"
                  }`}
                >
                  {event}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Add Webhook"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="px-5 py-2 bg-kova-charcoal-light border border-kova-border text-sm text-kova-silver rounded-lg hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Endpoint list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 bg-kova-surface border border-kova-border rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : endpoints.length === 0 ? (
        <div className="bg-kova-surface border border-kova-border rounded-xl p-16 text-center">
          <Globe size={24} className="text-kova-silver-dim mx-auto mb-3" />
          <p className="text-kova-silver-dim">
            No webhook endpoints configured.
          </p>
          <p className="text-sm text-kova-silver-dim mt-1">
            Add a webhook to receive real-time event notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((endpoint) => (
            <EndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
