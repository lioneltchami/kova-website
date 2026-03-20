import { Suspense } from "react";
import { CsvExportButton } from "@/components/dashboard/csv-export-button";
import {
  type DateRange,
  DateRangePicker,
  getDateRangeStart,
} from "@/components/dashboard/date-range-picker";
import { UsageFilters } from "@/components/dashboard/usage-filters";
import {
  type UsageRecord,
  UsageTable,
} from "@/components/dashboard/usage-table";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Usage Detail",
};

const PAGE_SIZE = 50;

interface UsagePageProps {
  searchParams: Promise<{
    range?: string;
    tool?: string;
    model?: string;
    project?: string;
    page?: string;
  }>;
}

export default async function UsagePage({ searchParams }: UsagePageProps) {
  const params = await searchParams;
  const range = (params.range as DateRange) ?? "30d";
  const since = getDateRangeStart(range);
  const toolFilter = params.tool ?? "";
  const modelFilter = params.model ?? "";
  const projectSearch = params.project ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Build query
  let query = supabase
    .from("usage_records")
    .select(
      "id, recorded_at, tool, model, project, input_tokens, output_tokens, cost_usd, session_id",
      { count: "exact" },
    )
    .eq("user_id", user.id)
    .gte("recorded_at", since.toISOString())
    .order("recorded_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (toolFilter) query = query.eq("tool", toolFilter);
  if (modelFilter) query = query.eq("model", modelFilter);
  if (projectSearch) query = query.ilike("project", `%${projectSearch}%`);

  const { data: records, count } = await query;

  // Fetch distinct tools and models for filter dropdowns
  const { data: toolRows } = await supabase
    .from("usage_records")
    .select("tool")
    .eq("user_id", user.id)
    .gte("recorded_at", since.toISOString());

  const { data: modelRows } = await supabase
    .from("usage_records")
    .select("model")
    .eq("user_id", user.id)
    .gte("recorded_at", since.toISOString());

  const distinctTools = [...new Set(toolRows?.map((r) => r.tool) ?? [])].sort();
  const distinctModels = [
    ...new Set(modelRows?.map((r) => r.model) ?? []),
  ].sort();

  const typedRecords: UsageRecord[] = (records ?? []).map((r) => ({
    id: r.id,
    recorded_at: r.recorded_at,
    tool: r.tool,
    model: r.model,
    project: r.project,
    input_tokens: r.input_tokens ?? 0,
    output_tokens: r.output_tokens ?? 0,
    cost_usd: Number(r.cost_usd ?? 0),
    session_id: r.session_id ?? "",
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Usage</h1>
          <p className="text-sm text-kova-silver-dim mt-0.5">
            Detailed AI tool usage records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CsvExportButton
            range={range}
            tool={toolFilter}
            model={modelFilter}
            project={projectSearch}
          />
          <Suspense fallback={null}>
            <DateRangePicker />
          </Suspense>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-kova-surface border border-kova-border rounded-xl p-4 mb-6">
        <Suspense fallback={null}>
          <UsageFilters
            tools={distinctTools}
            models={distinctModels}
            currentTool={toolFilter}
            currentModel={modelFilter}
            currentProject={projectSearch}
          />
        </Suspense>
      </div>

      {/* Table */}
      <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
        <Suspense
          fallback={
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-kova-charcoal-light rounded animate-pulse"
                />
              ))}
            </div>
          }
        >
          <UsageTable
            records={typedRecords}
            totalCount={count ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
          />
        </Suspense>
      </div>
    </div>
  );
}
