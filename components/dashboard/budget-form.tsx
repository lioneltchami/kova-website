"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

interface Budget {
  id: string;
  amount_usd: number;
  warn_at_percent: number;
  period: "monthly" | "daily";
}

interface BudgetFormProps {
  budget: Budget | null;
  period: "monthly" | "daily";
  label: string;
}

export function BudgetForm({ budget, period, label }: BudgetFormProps) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(budget ? String(budget.amount_usd) : "");
  const [warnAt, setWarnAt] = useState(
    budget ? String(budget.warn_at_percent) : "80",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    const amountNum = parseFloat(amount);
    const warnNum = parseInt(warnAt, 10);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    if (isNaN(warnNum) || warnNum < 1 || warnNum > 100) {
      setError("Warn threshold must be between 1 and 100.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const method = budget ? "PUT" : "POST";
      const body = budget
        ? { id: budget.id, amount_usd: amountNum, warn_at_percent: warnNum }
        : { period, amount_usd: amountNum, warn_at_percent: warnNum };

      const res = await fetch("/api/v1/budget", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to save budget.");
      } else {
        setSuccess(true);
        setEditing(false);
        setTimeout(() => setSuccess(false), 3000);
        // Refresh the page to reflect updates
        window.location.reload();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!budget) return;
    if (!confirm(`Remove ${period} budget?`)) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/budget?id=${budget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      } else {
        setError("Failed to remove budget.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-kova-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <div className="flex items-center gap-2">
          {success && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <Check size={12} />
              Saved
            </span>
          )}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-kova-silver-dim hover:text-kova-silver rounded-lg hover:bg-kova-charcoal-light transition-colors"
              title="Edit budget"
            >
              <Pencil size={13} />
            </button>
          ) : (
            <button
              onClick={() => {
                setEditing(false);
                setError(null);
                setAmount(budget ? String(budget.amount_usd) : "");
                setWarnAt(budget ? String(budget.warn_at_percent) : "80");
              }}
              className="p-1.5 text-kova-silver-dim hover:text-kova-silver rounded-lg hover:bg-kova-charcoal-light transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {budget && !editing ? (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              ${Number(budget.amount_usd).toFixed(2)}
            </span>
            <span className="text-sm text-kova-silver-dim">
              {period === "monthly" ? "/ month" : "/ day"}
            </span>
          </div>
          <p className="text-xs text-kova-silver-dim">
            Alert at {budget.warn_at_percent}% usage
          </p>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="mt-2 text-xs text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            Remove budget
          </button>
        </div>
      ) : !editing ? (
        <div>
          <p className="text-sm text-kova-silver-dim mb-3">
            No {period} budget set.
          </p>
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-xs bg-kova-charcoal-light border border-kova-border text-kova-silver rounded-lg hover:border-kova-blue/50 hover:text-white transition-colors"
          >
            Set {period} budget
          </button>
        </div>
      ) : null}

      {editing && (
        <div className="space-y-3">
          {error && (
            <div className="px-3 py-2 bg-red-900/20 border border-red-800/40 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-kova-silver-dim mb-1.5">
              Budget Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-kova-silver-dim text-sm">
                $
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver placeholder:text-kova-silver-dim/60 focus:outline-none focus:border-kova-blue transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-kova-silver-dim mb-1.5">
              Alert Threshold (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={warnAt}
              onChange={(e) => setWarnAt(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver focus:outline-none focus:border-kova-blue transition-colors"
            />
            <p className="text-xs text-kova-silver-dim mt-1">
              You'll receive an alert when spend reaches this % of the budget.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-kova-blue text-white text-sm rounded-lg hover:bg-kova-blue-light transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? "Saving..." : "Save Budget"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
