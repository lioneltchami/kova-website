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
    label: "Init",
    code: `# Navigate to your project
cd your-project

# Initialize Kova (interactive setup)
kova init

# Creates:
#   .claude/skills/        specialist agent skills
#   .claude/tasks/         session and plan files
#   kova.yaml              project configuration`,
    language: "bash",
  },
  {
    label: "Plan",
    code: `# Generate a structured plan
kova plan "add user authentication"

# With a specific template
kova plan --template feature "add user authentication"

# Link a GitHub issue
kova plan --issue 42 "add user authentication"

# Output:
#   Plan created: .claude/tasks/user-auth.md
#   Tasks: 7 | Agents: 4 | Est: 2x haiku, 3x sonnet, 1x opus`,
    language: "bash",
  },
  {
    label: "Build",
    code: `# Execute the plan
kova build --live

# Resume after a crash or rate limit
kova build --resume

# Live output shows:
#   [done]    setup-schema       haiku    38s
#   [done]    build-api          sonnet   2m 12s
#   [running] quality-validation sonnet   started 45s ago
#   [pending] update-docs        haiku`,
    language: "bash",
  },
  {
    label: "Ship",
    code: `# Create a GitHub PR
kova pr

# Create as draft PR
kova pr --draft

# Output:
#   Branch: feat/user-auth -> main
#   PR title: "feat: add user authentication"
#   Linked issues: #42
#   PR #43 created: https://github.com/org/repo/pull/43`,
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
            Five commands. Plan to merged PR. No configuration required to
            start.
          </p>
        </div>

        <CodeBlock tabs={tabs} />

        <p className="mt-6 text-center text-sm text-[#C0C0C8]/50">
          Requires Node.js 18+ and a Claude API key set as{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-[#4361EE]">
            ANTHROPIC_API_KEY
          </code>
        </p>
      </div>
    </section>
  );
}
