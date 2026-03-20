import type { Metadata } from "next";
import Link from "next/link";
import { WolfLogo } from "@/components/landing/wolf-logo";
import {
  StatusIndicator,
  type StatusLevel,
} from "@/components/status/status-indicator";
import { createAdminClient } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "System Status | Kova",
  description: "Real-time status of Kova platform components.",
};

// Revalidate every 60 seconds so the public page stays fresh
export const revalidate = 60;

const COMPONENTS = [
  { key: "API", label: "API" },
  { key: "Dashboard", label: "Dashboard" },
  { key: "Sync", label: "CLI Sync" },
  { key: "Webhooks", label: "Webhooks" },
  { key: "Database", label: "Database" },
] as const;

type ComponentKey = (typeof COMPONENTS)[number]["key"];

interface HealthRow {
  component: string;
  status: StatusLevel;
  latency_ms: number | null;
  checked_at: string;
}

interface ComponentSummary {
  latestStatus: StatusLevel;
  latestCheck: string | null;
  uptimePercent: number;
  degradedInLastHour: boolean;
}

function computeUptime(rows: HealthRow[]): number {
  if (rows.length === 0) return 100;
  const healthy = rows.filter((r) => r.status === "healthy").length;
  return Math.round((healthy / rows.length) * 1000) / 10;
}

function formatChecked(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function overallStatus(
  summaries: Record<string, ComponentSummary>,
): StatusLevel {
  const statuses = Object.values(summaries).map((s) => s.latestStatus);
  if (statuses.some((s) => s === "down")) return "down";
  if (statuses.some((s) => s === "degraded")) return "degraded";
  return "healthy";
}

const OVERALL_BANNER: Record<
  StatusLevel,
  { bg: string; border: string; text: string; message: string }
> = {
  healthy: {
    bg: "bg-emerald-900/20",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    message: "All systems operational",
  },
  degraded: {
    bg: "bg-amber-900/20",
    border: "border-amber-500/30",
    text: "text-amber-400",
    message: "Some systems are experiencing issues",
  },
  down: {
    bg: "bg-red-900/20",
    border: "border-red-500/30",
    text: "text-red-400",
    message: "Service disruption in progress",
  },
};

export default async function StatusPage() {
  let rawRows: HealthRow[] = [];

  try {
    const admin = createAdminClient();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data } = await admin
      .from("health_checks")
      .select("component, status, latency_ms, checked_at")
      .gte("checked_at", since24h)
      .order("checked_at", { ascending: false });

    rawRows = (data ?? []) as HealthRow[];
  } catch {
    // Admin client not configured (local dev without env vars) -- render empty state
  }

  // Group rows by component
  const grouped: Record<ComponentKey, HealthRow[]> = {} as Record<
    ComponentKey,
    HealthRow[]
  >;
  for (const { key } of COMPONENTS) {
    grouped[key] = rawRows.filter((r) => r.component === key);
  }

  // Build summaries
  const summaries: Record<string, ComponentSummary> = {};
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  for (const { key } of COMPONENTS) {
    const rows = grouped[key];
    const latest = rows[0] ?? null;
    const degradedInLastHour = rows.some(
      (r) => r.checked_at >= oneHourAgo && r.status !== "healthy",
    );

    summaries[key] = {
      latestStatus: (latest?.status as StatusLevel) ?? "healthy",
      latestCheck: latest?.checked_at ?? null,
      uptimePercent: computeUptime(rows),
      degradedInLastHour,
    };
  }

  const overall = overallStatus(summaries);
  const bannerConfig = OVERALL_BANNER[overall];

  const anyIncidentInLastHour = Object.values(summaries).some(
    (s) => s.degradedInLastHour,
  );

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <WolfLogo size={22} />
            <span className="text-sm font-bold tracking-widest text-slate-900 uppercase">
              Kova
            </span>
          </Link>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            System Status
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Overall status banner */}
        <div
          className={`rounded-xl border px-6 py-5 mb-8 ${bannerConfig.bg} ${bannerConfig.border}`}
        >
          <div className="flex items-center gap-3">
            <StatusIndicator status={overall} showLabel={false} />
            <p className={`text-base font-semibold ${bannerConfig.text}`}>
              {bannerConfig.message}
            </p>
          </div>
        </div>

        {/* Incident banner */}
        {anyIncidentInLastHour && overall !== "healthy" && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-6 py-4 mb-8">
            <p className="text-sm font-medium text-amber-800">
              One or more components reported issues in the past hour. Our team
              is investigating.
            </p>
          </div>
        )}

        {/* Component grid */}
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Components
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {COMPONENTS.map(({ key, label }) => {
            const summary = summaries[key];
            return (
              <div
                key={key}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {label}
                  </p>
                  <StatusIndicator status={summary.latestStatus} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Uptime (24h)</span>
                    <span className="text-xs font-mono font-semibold text-slate-700">
                      {summary.uptimePercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Last check</span>
                    <span className="text-xs font-mono text-slate-600">
                      {formatChecked(summary.latestCheck)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-xs text-slate-400 text-center">
          Updated every 60 seconds. For incidents, contact{" "}
          <a
            href="mailto:support@kova.dev"
            className="underline hover:text-slate-600"
          >
            support@kova.dev
          </a>
        </p>
      </main>
    </div>
  );
}
