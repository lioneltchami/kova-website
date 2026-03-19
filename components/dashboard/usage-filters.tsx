"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface UsageFiltersProps {
  tools: string[];
  models: string[];
  currentTool: string;
  currentModel: string;
  currentProject: string;
}

export function UsageFilters({
  tools,
  models,
  currentTool,
  currentModel,
  currentProject,
}: UsageFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tool");
    params.delete("model");
    params.delete("project");
    params.set("page", "1");
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }, [router, searchParams]);

  const hasActiveFilters = currentTool || currentModel || currentProject;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Tool filter */}
      <select
        value={currentTool}
        onChange={(e) => updateParam("tool", e.target.value)}
        className="px-3 py-1.5 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver focus:outline-none focus:border-kova-blue transition-colors"
      >
        <option value="">All tools</option>
        {tools.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Model filter */}
      <select
        value={currentModel}
        onChange={(e) => updateParam("model", e.target.value)}
        className="px-3 py-1.5 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver focus:outline-none focus:border-kova-blue transition-colors"
      >
        <option value="">All models</option>
        {models.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* Project search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-kova-silver-dim pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search project..."
          defaultValue={currentProject}
          onChange={(e) => {
            const val = e.target.value;
            clearTimeout(
              (
                window as {
                  _projectSearchTimer?: ReturnType<typeof setTimeout>;
                }
              )._projectSearchTimer,
            );
            (
              window as { _projectSearchTimer?: ReturnType<typeof setTimeout> }
            )._projectSearchTimer = setTimeout(
              () => updateParam("project", val),
              350,
            );
          }}
          className="w-full pl-7 pr-3 py-1.5 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver placeholder:text-kova-silver-dim/60 focus:outline-none focus:border-kova-blue transition-colors"
        />
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-kova-silver-dim border border-kova-border rounded-lg hover:text-kova-silver hover:border-kova-blue/50 transition-colors"
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
}
