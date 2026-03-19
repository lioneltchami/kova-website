"use client";

import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { formatCost } from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";

export interface DeveloperRow {
  userId: string;
  email: string;
  totalCost: number;
  sessionCount: number;
  topModel: string;
  toolBreakdown: Record<string, number>;
}

interface DeveloperTableProps {
  rows: DeveloperRow[];
}

type SortField = "totalCost" | "sessionCount";

export function DeveloperTable({ rows }: DeveloperTableProps) {
  const [sortField, setSortField] = useState<SortField>("totalCost");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sorted = [...rows].sort((a, b) => {
    const cmp = a[sortField] - b[sortField];
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-kova-silver-dim text-sm">
        No developer data available for this period.
      </div>
    );
  }

  const topCost = sorted[0]?.totalCost ?? 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-kova-border">
            <th className="pb-3 pr-4 text-xs text-kova-silver-dim uppercase tracking-wider font-medium">
              Developer
            </th>
            <th className="pb-3 pr-4">
              <button
                onClick={() => handleSort("totalCost")}
                className={cn(
                  "flex items-center gap-1 text-xs uppercase tracking-wider font-medium transition-colors",
                  sortField === "totalCost"
                    ? "text-kova-blue"
                    : "text-kova-silver-dim hover:text-kova-silver",
                )}
              >
                Total Cost
                <ChevronsUpDown size={12} />
              </button>
            </th>
            <th className="pb-3 pr-4">
              <button
                onClick={() => handleSort("sessionCount")}
                className={cn(
                  "flex items-center gap-1 text-xs uppercase tracking-wider font-medium transition-colors",
                  sortField === "sessionCount"
                    ? "text-kova-blue"
                    : "text-kova-silver-dim hover:text-kova-silver",
                )}
              >
                Sessions
                <ChevronsUpDown size={12} />
              </button>
            </th>
            <th className="pb-3 pr-4 text-xs text-kova-silver-dim uppercase tracking-wider font-medium">
              Top Model
            </th>
            <th className="pb-3 text-xs text-kova-silver-dim uppercase tracking-wider font-medium">
              Tools
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const barWidth = topCost > 0 ? (row.totalCost / topCost) * 100 : 0;
            const toolEntries = Object.entries(row.toolBreakdown)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3);

            return (
              <tr
                key={row.userId}
                className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/40 transition-colors"
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-kova-charcoal-light border border-kova-border flex items-center justify-center text-xs text-kova-silver font-bold flex-shrink-0">
                      {(row.email[0] ?? "?").toUpperCase()}
                    </div>
                    <span className="text-sm text-kova-silver truncate max-w-[160px]">
                      {row.email}
                    </span>
                    {i === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/30 text-amber-400 font-semibold uppercase tracking-wider">
                        Top
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-kova-silver font-medium min-w-[56px]">
                      {formatCost(row.totalCost)}
                    </span>
                    <div className="h-1.5 rounded-full bg-kova-charcoal-light flex-1 min-w-[60px] max-w-[100px]">
                      <div
                        className="h-full rounded-full bg-kova-blue"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-sm text-kova-silver-dim">
                  {row.sessionCount.toLocaleString()}
                </td>
                <td className="py-3 pr-4 text-sm text-kova-silver-dim font-mono text-xs">
                  {row.topModel}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {toolEntries.map(([tool, cost]) => (
                      <span
                        key={tool}
                        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-kova-charcoal-light text-kova-silver-dim border border-kova-border"
                        title={`${tool}: ${formatCost(cost)}`}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
