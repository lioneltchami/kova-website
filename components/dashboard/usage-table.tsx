"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  formatCost,
  formatRelativeDate,
  formatTokens,
} from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";

export interface UsageRecord {
  id: string;
  recorded_at: string;
  tool: string;
  model: string;
  project: string | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  session_id: string;
}

type SortField =
  | "recorded_at"
  | "tool"
  | "model"
  | "project"
  | "tokens"
  | "cost_usd";
type SortDir = "asc" | "desc";

interface UsageTableProps {
  records: UsageRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function SortButton({
  field,
  currentField,
  currentDir,
  onClick,
  children,
}: {
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
  onClick: (f: SortField) => void;
  children: React.ReactNode;
}) {
  const active = currentField === field;
  return (
    <button
      onClick={() => onClick(field)}
      className={cn(
        "flex items-center gap-1 text-xs uppercase tracking-wider font-medium transition-colors",
        active
          ? "text-kova-blue"
          : "text-kova-silver-dim hover:text-kova-silver",
      )}
    >
      {children}
      <ChevronsUpDown
        size={12}
        className={active ? "text-kova-blue" : "opacity-40"}
      />
    </button>
  );
}

function exportToCSV(records: UsageRecord[]) {
  const headers = [
    "Timestamp",
    "Tool",
    "Model",
    "Project",
    "Input Tokens",
    "Output Tokens",
    "Total Tokens",
    "Cost (USD)",
  ];
  const rows = records.map((r) => [
    r.recorded_at,
    r.tool,
    r.model,
    r.project ?? "",
    String(r.input_tokens),
    String(r.output_tokens),
    String(r.input_tokens + r.output_tokens),
    Number(r.cost_usd).toFixed(8),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kova-usage-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function UsageTable({
  records,
  totalCount,
  page,
  pageSize,
}: UsageTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sortField = (searchParams.get("sort") as SortField) ?? "recorded_at";
  const sortDir = (searchParams.get("dir") as SortDir) ?? "desc";

  const totalPages = Math.ceil(totalCount / pageSize);

  const updateParam = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        params.set(key, value);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      updateParam({
        sort: field,
        dir: sortDir === "asc" ? "desc" : "asc",
        page: "1",
      });
    } else {
      updateParam({ sort: field, dir: "desc", page: "1" });
    }
  };

  const goToPage = (p: number) => {
    updateParam({ page: String(p) });
  };

  // Client-side sort of the current page (server provides page data, client sorts within page)
  const [localSort, setLocalSort] = useState<{
    field: SortField;
    dir: SortDir;
  }>({
    field: sortField,
    dir: sortDir,
  });

  const sorted = [...records].sort((a, b) => {
    let cmp = 0;
    switch (localSort.field) {
      case "recorded_at":
        cmp = a.recorded_at.localeCompare(b.recorded_at);
        break;
      case "tool":
        cmp = a.tool.localeCompare(b.tool);
        break;
      case "model":
        cmp = a.model.localeCompare(b.model);
        break;
      case "project":
        cmp = (a.project ?? "").localeCompare(b.project ?? "");
        break;
      case "tokens":
        cmp =
          a.input_tokens + a.output_tokens - (b.input_tokens + b.output_tokens);
        break;
      case "cost_usd":
        cmp = Number(a.cost_usd) - Number(b.cost_usd);
        break;
    }
    return localSort.dir === "asc" ? cmp : -cmp;
  });

  const handleLocalSort = (field: SortField) => {
    setLocalSort((prev) => ({
      field,
      dir: prev.field === field && prev.dir === "desc" ? "asc" : "desc",
    }));
    handleSort(field);
  };

  return (
    <div>
      {/* Table actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-kova-silver-dim">
          {totalCount === 0
            ? "No records"
            : `${totalCount.toLocaleString()} records`}
        </p>
        <button
          onClick={() => exportToCSV(records)}
          disabled={records.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-kova-silver-dim border border-kova-border rounded-lg hover:text-kova-silver hover:border-kova-blue/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-kova-silver-dim">
            No usage records match your filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-kova-border">
                <th className="pb-3 pr-4">
                  <SortButton
                    field="recorded_at"
                    currentField={localSort.field}
                    currentDir={localSort.dir}
                    onClick={handleLocalSort}
                  >
                    When
                  </SortButton>
                </th>
                <th className="pb-3 pr-4">
                  <SortButton
                    field="tool"
                    currentField={localSort.field}
                    currentDir={localSort.dir}
                    onClick={handleLocalSort}
                  >
                    Tool
                  </SortButton>
                </th>
                <th className="pb-3 pr-4">
                  <SortButton
                    field="model"
                    currentField={localSort.field}
                    currentDir={localSort.dir}
                    onClick={handleLocalSort}
                  >
                    Model
                  </SortButton>
                </th>
                <th className="pb-3 pr-4">
                  <SortButton
                    field="project"
                    currentField={localSort.field}
                    currentDir={localSort.dir}
                    onClick={handleLocalSort}
                  >
                    Project
                  </SortButton>
                </th>
                <th className="pb-3 pr-4">
                  <SortButton
                    field="tokens"
                    currentField={localSort.field}
                    currentDir={localSort.dir}
                    onClick={handleLocalSort}
                  >
                    Tokens
                  </SortButton>
                </th>
                <th className="pb-3">
                  <SortButton
                    field="cost_usd"
                    currentField={localSort.field}
                    currentDir={localSort.dir}
                    onClick={handleLocalSort}
                  >
                    Cost
                  </SortButton>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((record) => (
                <tr
                  key={`${record.id}-${record.recorded_at}`}
                  className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/40 transition-colors"
                >
                  <td className="py-3 pr-4 text-kova-silver-dim text-sm whitespace-nowrap">
                    {formatRelativeDate(record.recorded_at)}
                  </td>
                  <td className="py-3 pr-4 text-kova-silver text-sm font-medium">
                    {record.tool}
                  </td>
                  <td className="py-3 pr-4 text-kova-silver-dim text-sm font-mono text-xs">
                    {record.model}
                  </td>
                  <td className="py-3 pr-4 text-kova-silver-dim text-sm max-w-[180px] truncate">
                    {record.project ?? (
                      <span className="text-kova-silver-dim/50">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-kova-silver-dim text-sm">
                    {formatTokens(record.input_tokens + record.output_tokens)}
                  </td>
                  <td className="py-3 text-kova-silver text-sm">
                    {formatCost(Number(record.cost_usd))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-kova-border">
          <p className="text-xs text-kova-silver-dim">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-kova-border text-kova-silver-dim hover:text-kova-silver hover:border-kova-blue/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={cn(
                    "w-7 h-7 rounded-lg text-xs font-medium transition-colors",
                    p === page
                      ? "bg-kova-blue text-white"
                      : "text-kova-silver-dim hover:text-kova-silver hover:bg-kova-charcoal-light",
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-kova-border text-kova-silver-dim hover:text-kova-silver hover:border-kova-blue/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
