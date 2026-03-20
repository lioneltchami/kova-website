"use client";

import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never synced";
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " at " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
}

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/api-keys");
      if (res.ok) {
        const data = (await res.json()) as ApiKey[];
        setKeys(data);
      }
    } catch {
      setError("Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKeys();
  }, [fetchKeys]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "CLI Key" }),
      });
      if (res.ok) {
        const data = (await res.json()) as { key: string };
        setNewKey(data.key);
        await fetchKeys();
      } else {
        setError("Failed to create API key.");
      }
    } catch {
      setError("Failed to create API key.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/v1/api-keys?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchKeys();
      } else {
        setError("Failed to revoke key.");
      }
    } catch {
      setError("Failed to revoke key.");
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-12 bg-kova-charcoal-light rounded-lg animate-pulse"
          />
        ))}
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

      {/* New key reveal */}
      {newKey && (
        <div className="mb-4 p-4 bg-kova-charcoal-light border border-kova-blue/40 rounded-xl">
          <p className="text-xs text-kova-silver-dim mb-2 font-medium uppercase tracking-wider">
            New API Key -- Copy it now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm text-kova-blue font-mono bg-kova-charcoal px-3 py-2 rounded-lg break-all">
              {newKey}
            </code>
            <button
              onClick={() => handleCopy(newKey)}
              className="flex-shrink-0 p-2 rounded-lg bg-kova-blue text-white hover:bg-kova-blue-light transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs text-kova-silver-dim hover:text-kova-silver transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Key list */}
      {keys.length === 0 ? (
        <p className="text-sm text-kova-silver-dim py-4">
          No API keys yet. Create one below.
        </p>
      ) : (
        <div className="space-y-2 mb-4">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between gap-3 px-4 py-3 bg-kova-charcoal-light border border-kova-border rounded-lg"
            >
              <div className="min-w-0">
                <p className="text-sm text-kova-silver font-medium truncate">
                  {key.name}
                </p>
                <p className="text-xs text-kova-silver-dim font-mono mt-0.5">
                  {key.key_prefix}...{" "}
                  <span className="ml-2">
                    Last sync: {formatDate(key.last_used_at)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => handleRevoke(key.id)}
                className="flex-shrink-0 p-1.5 rounded-lg text-kova-silver-dim hover:text-red-400 hover:bg-red-900/20 transition-colors"
                title="Revoke key"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={creating}
        className="flex items-center gap-2 px-4 py-2 bg-kova-charcoal-light border border-kova-border text-sm text-kova-silver hover:text-white hover:border-kova-blue rounded-lg transition-colors disabled:opacity-50"
      >
        <Plus size={14} />
        {creating ? "Creating..." : "Create New Key"}
      </button>
    </div>
  );
}
