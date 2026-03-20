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
    "bg-kova-charcoal-light text-kova-silver-dim border border-kova-border";
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
    <div className="min-h-screen bg-kova-charcoal">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Changelog</h1>
          <p className="text-kova-silver-dim text-base">
            Release history and updates for Kova AI Dev FinOps.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-0 top-2 bottom-2 w-px bg-kova-border"
            aria-hidden="true"
          />

          <div className="space-y-10">
            {entries.map((entry, index) => (
              <div key={`${entry.version}-${index}`} className="relative pl-8">
                {/* Timeline dot */}
                <div
                  className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-kova-blue ring-2 ring-kova-charcoal"
                  aria-hidden="true"
                />

                {/* Entry card */}
                <article className="bg-kova-surface border border-kova-border rounded-xl p-6 hover:border-kova-border/80 transition-colors">
                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <time
                      dateTime={entry.date}
                      className="text-xs text-kova-silver-dim font-mono"
                    >
                      {formatDate(entry.date)}
                    </time>
                    <span className="text-kova-border select-none">|</span>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-kova-charcoal-light border border-kova-border text-xs font-mono text-kova-silver">
                      v{entry.version}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <Tag key={tag} tag={tag} />
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-semibold text-white mb-4">
                    {entry.title}
                  </h2>

                  {/* Changes */}
                  <ul className="space-y-2">
                    {entry.changes.map((change, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-kova-silver"
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
        <div className="mt-12 pt-8 border-t border-kova-border">
          <p className="text-xs text-kova-silver-dim">
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
