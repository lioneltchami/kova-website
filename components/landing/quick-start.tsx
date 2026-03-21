"use client";

import { CodeBlock } from "@/components/ui/code-block";
import { TextAnimate } from "@/components/ui/text-animate";

const tabs = [
  {
    label: "Install",
    code: `# Install Kova globally
npm install -g kova-cli

# Or use without installing
npx kova-cli init`,
    language: "bash",
  },
  {
    label: "Track",
    code: `# Navigate to your project
cd your-project

# Interactive setup (detects your AI tools)
kova init

# Scan and record AI tool usage
kova track

# Output:
#   Scanning claude_code... 14 new records
#   Scanning cursor... 8 new records
#   Total: 22 records saved`,
    language: "bash",
  },
  {
    label: "Costs",
    code: `# View cost breakdown
kova costs --week

# Output:
#   AI Tool Costs (Last 7 Days)
#   ================================================
#   Tool            Sessions  Cost      Cost/Session
#   ------------------------------------------------
#   claude-code     42        $18.40    $0.44
#   cursor          89        $6.20     $0.07
#   ------------------------------------------------
#   Total: $24.60 across 131 sessions

# Compare tools or models side-by-side
kova compare --models`,
    language: "bash",
  },
  {
    label: "Run",
    code: `# Execute AI coding tasks with cost tracking
kova run "fix the auth bug in login.ts" --budget 2.00

# Output:
#   Complexity: moderate -> Claude Sonnet
#   Context: 3 files (12 KB)
#
#   [response streams here...]
#
#   Cost    $0.0842
#   Tokens  2,140 in / 1,680 out
#   Duration 4.2s

# Attach file context
kova run "add tests" --include "src/**/*.ts"`,
    language: "bash",
  },
  {
    label: "Dashboard",
    code: `# Sync usage data to the cloud
kova sync

# Open the web dashboard
kova dashboard

# Set spending budgets
kova budget set --monthly 100 --daily 10

# Output:
#   Monthly budget: $100.00
#   Daily budget: $10.00
#   Warning threshold: 80%`,
    language: "bash",
  },
];

export function QuickStart() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            <TextAnimate animation="slideUp">
              Get Started in 30 Seconds
            </TextAnimate>
          </h2>
          <p className="text-[#C0C0C8]">
            Five steps. Install to dashboard. Real-time cost visibility from day
            one.
          </p>
        </div>

        <CodeBlock tabs={tabs} />

        <p className="mt-6 text-center text-sm text-[#C0C0C8]/50">
          Requires Node.js 18+. Add provider keys with{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-[#4361EE]">
            kova provider add
          </code>
        </p>
      </div>
    </section>
  );
}
