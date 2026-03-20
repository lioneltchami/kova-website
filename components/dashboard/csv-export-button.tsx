"use client";

import { Download } from "lucide-react";
import { useState } from "react";

interface CsvExportButtonProps {
  range: string;
  tool: string;
  model: string;
  project: string;
}

export function CsvExportButton({
  range,
  tool,
  model,
  project,
}: CsvExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ range });
      if (tool) params.set("tool", tool);
      if (model) params.set("model", model);
      if (project) params.set("project", project);

      const res = await fetch(`/api/v1/usage/export?${params.toString()}`);

      if (!res.ok) {
        setError("Export failed. Please try again.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Use filename from Content-Disposition if present, else fall back
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      a.download =
        match?.[1] ?? `kova-usage-${new Date().toISOString().slice(0, 10)}.csv`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 bg-kova-surface border border-kova-border text-kova-silver hover:bg-kova-charcoal-light rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download size={15} />
        {loading ? "Exporting..." : "Export CSV"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
