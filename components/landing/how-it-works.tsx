"use client";

import { DirectionAwareTabs } from "@/components/ui/direction-aware-tabs";
import { CodeBlock } from "@/components/ui/code-block";
import { TextAnimate } from "@/components/ui/text-animate";

const planCode = `$ kova plan --template feature "add user profiles"

  Analyzing codebase...        routes, components, services
  Mapping dependencies...      auth layer, database schema
  Assigning specialists...     frontend, backend, database

  Plan created: .claude/tasks/user-profiles.md
  Tasks: 8 | Agents: 4 | Est: 2x haiku, 4x sonnet, 1x opus`;

const buildCode = `$ kova build --live

  Building: user-profiles
  [=========>        ] 5/8 tasks (62%)

  [done]    setup-schema         haiku    38s
  [done]    build-api            sonnet   2m 12s
  [done]    build-frontend       sonnet   1m 58s
  [done]    write-tests          sonnet   1m 14s
  [running] quality-validation   sonnet   started 45s ago
  [pending] security-review      opus
  [pending] update-docs          haiku`;

const shipCode = `$ kova pr --draft

  Creating PR: Add User Profiles
  Branch: feat/user-profiles -> main

  Generating title...          "feat: add user profile pages"
  Linking issues...            closes #14, #17
  Writing PR body...           7 tasks completed, 2 agents
  Pushing branch...            done

  PR #43 created:
  https://github.com/org/repo/pull/43`;

const tabs = [
  {
    label: "Plan",
    content: (
      <div className="space-y-6">
        <CodeBlock code={planCode} language="bash" />
        <div className="rounded-xl border border-white/10 bg-[#1A1A2E]/60 p-6">
          <h3 className="mb-2 text-base font-semibold text-white">
            Analyze. Map. Assign.
          </h3>
          <p className="text-sm leading-relaxed text-[#C0C0C8]">
            Claude analyzes your entire codebase before writing a single line of
            code. It maps dependency trees, identifies affected files, and
            assigns the right specialist agents with explicit acceptance
            criteria. No assumptions. No wasted tokens.
          </p>
        </div>
      </div>
    ),
  },
  {
    label: "Build",
    content: (
      <div className="space-y-6">
        <CodeBlock code={buildCode} language="bash" />
        <div className="rounded-xl border border-white/10 bg-[#1A1A2E]/60 p-6">
          <h3 className="mb-2 text-base font-semibold text-white">
            Parallel. Ordered. Validated.
          </h3>
          <p className="text-sm leading-relaxed text-[#C0C0C8]">
            Hub-and-spoke execution dispatches specialist agents in dependency
            order. Frontend waits for the API. The API waits for the schema. A
            dedicated quality engineer validates independently -- never the
            agent that wrote the code.
          </p>
        </div>
      </div>
    ),
  },
  {
    label: "Ship",
    content: (
      <div className="space-y-6">
        <CodeBlock code={shipCode} language="bash" />
        <div className="rounded-xl border border-white/10 bg-[#1A1A2E]/60 p-6">
          <h3 className="mb-2 text-base font-semibold text-white">
            Branch. PR. Merged.
          </h3>
          <p className="text-sm leading-relaxed text-[#C0C0C8]">
            Auto-create a GitHub PR with a generated title and body. Kova links
            related issues, lists completed tasks, and shows build status. Zero
            manual PR writing. Idea to merged PR without leaving your terminal.
          </p>
        </div>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            <TextAnimate animation="slideUp">How the Pack Works</TextAnimate>
          </h2>
          <p className="mx-auto max-w-xl text-[#C0C0C8]">
            Three commands. Unlimited scale. Every step is transparent,
            recoverable, and validated.
          </p>
        </div>
        <DirectionAwareTabs tabs={tabs} />
      </div>
    </section>
  );
}
