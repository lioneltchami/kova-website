import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog - Kova",
  description: "What's new in Kova - AI Dev FinOps",
};

interface ChangelogEntry {
  date: string;
  version: string;
  title: string;
  tags: string[];
  changes: string[];
}

const entries: ChangelogEntry[] = [
  {
    date: "2026-03-20",
    version: "2.1.0",
    title: "AI Orchestration & Smart Fallback",
    tags: ["feature"],
    changes: [
      "kova run - execute AI coding tasks with intelligent model routing and multi-file context",
      "kova chat - interactive AI coding REPL with session budget tracking",
      "kova history - view past AI session history with costs and filtering",
      "kova bench - benchmark prompts against multiple models side-by-side",
      "kova hook - install Claude Code integration hooks for automatic tracking",
      "kova mcp - expose cost data as an MCP server for AI assistants",
      "Smart model fallback with automatic retry using cheaper models on 429/5xx errors",
      "Session budget guard with real-time spend tracking, 80% warning, and 100% hard stop",
      "Multi-file context loading with --context and --include flags for kova run",
      "56 new tests (731 total), zero failures",
    ],
  },
  {
    date: "2026-03-19",
    version: "0.4.1",
    title: "Production Hardening & Security",
    tags: ["security", "infrastructure"],
    changes: [
      "15 security vulnerabilities fixed (RLS hardening, webhook guards, env validation)",
      "Upstash Redis rate limiting replacing in-memory store",
      "Sentry error tracking for both CLI and website",
      "Budget alert emails via Resend",
      "Weekly cost digest emails for Pro/Enterprise users",
      "Dashboard error boundaries and loading states",
      "Queries migrated to rollup tables for performance",
      "Landing page updated to FinOps identity",
      "Public API documentation added",
      "86 website tests (Vitest + Playwright)",
    ],
  },
  {
    date: "2026-03-19",
    version: "0.4.0",
    title: "Launch-Ready",
    tags: ["feature", "security"],
    changes: [
      "Subscription enforcement in kova sync (Pro required for cloud sync)",
      "Relative date parsing (kova costs --since 7d)",
      "--auto-sync flag for daemon mode",
      "Rate limiting on usage API (100 req/min)",
      "CSV export endpoint and dashboard button",
      "Checkout success toast in dashboard",
      "Polar product prices corrected ($15 Pro, $30 Enterprise)",
      "8 stale orchestration docs removed, 5 new docs added",
    ],
  },
  {
    date: "2026-03-18",
    version: "0.3.0",
    title: "Web Dashboard & Multi-Tool Collectors",
    tags: ["feature"],
    changes: [
      "Full web dashboard: cost overview, usage table, analytics, budget management, team management",
      "Multi-tool collectors for Cursor, Copilot, Windsurf, and Devin",
      "Polar.sh payments (Pro $15/seat, Enterprise $30/seat)",
      "Supabase schema with partitioned tables and RLS",
      "CLI sync aligned with dashboard API",
    ],
  },
  {
    date: "2026-03-17",
    version: "0.1.0",
    title: "Initial Release",
    tags: ["feature"],
    changes: [
      "Core CLI with 11 commands",
      "Claude Code cost tracking",
      "Local budget management",
      "CSV and JSON report export",
      "415 tests",
    ],
  },
];

const tagStyles: Record<string, string> = {
  security: "bg-red-900/30 text-red-400 border border-red-800/40",
  infrastructure: "bg-amber-900/30 text-amber-400 border border-amber-800/40",
  feature: "bg-kova-blue/20 text-kova-blue border border-kova-blue/30",
  fix: "bg-green-900/30 text-green-400 border border-green-800/40",
};

function Tag({ tag }: { tag: string }) {
  const style =
    tagStyles[tag] ??
    "bg-gray-100 dark:bg-kova-charcoal-light text-gray-500 dark:text-kova-silver-dim border border-gray-200 dark:border-kova-border";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}
    >
      {tag}
    </span>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-kova-charcoal">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Changelog
          </h1>
          <p className="text-gray-500 dark:text-kova-silver-dim text-base">
            Release history and updates for Kova AI Dev FinOps.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-kova-border"
            aria-hidden="true"
          />

          <div className="space-y-10">
            {entries.map((entry, index) => (
              <div key={`${entry.version}-${index}`} className="relative pl-8">
                {/* Timeline dot */}
                <div
                  className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-kova-blue ring-2 ring-white dark:ring-kova-charcoal"
                  aria-hidden="true"
                />

                {/* Entry card */}
                <article className="bg-gray-50 dark:bg-kova-surface border border-gray-200 dark:border-kova-border rounded-xl p-6 hover:border-gray-300 dark:hover:border-kova-border/80 transition-colors">
                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <time
                      dateTime={entry.date}
                      className="text-xs text-gray-500 dark:text-kova-silver-dim font-mono"
                    >
                      {formatDate(entry.date)}
                    </time>
                    <span className="text-gray-300 dark:text-kova-border select-none">
                      |
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 dark:bg-kova-charcoal-light border border-gray-200 dark:border-kova-border text-xs font-mono text-gray-700 dark:text-kova-silver">
                      v{entry.version}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <Tag key={tag} tag={tag} />
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                    {entry.title}
                  </h2>

                  {/* Changes */}
                  <ul className="space-y-2">
                    {entry.changes.map((change, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-kova-silver"
                      >
                        <span
                          className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-kova-blue/60"
                          aria-hidden="true"
                        />
                        {change}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-kova-border">
          <p className="text-xs text-gray-500 dark:text-kova-silver-dim">
            For full commit history, see the{" "}
            <a
              href="https://github.com/lioneltchami/kova-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-kova-blue hover:text-kova-blue-light transition-colors underline underline-offset-2"
            >
              GitHub repository
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
