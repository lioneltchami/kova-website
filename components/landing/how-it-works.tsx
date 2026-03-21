"use client";

import { useTranslations } from "next-intl";
import { CodeBlock } from "@/components/ui/code-block";
import { DirectionAwareTabs } from "@/components/ui/direction-aware-tabs";
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

export function HowItWorks() {
	const t = useTranslations("howItWorks");

	const tabs = [
		{
			label: t("planTab"),
			content: (
				<div className="space-y-6">
					<CodeBlock code={planCode} language="bash" />
					<div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1A1A2E]/60 p-6">
						<h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
							{t("planCardTitle")}
						</h3>
						<p className="text-sm leading-relaxed text-gray-700 dark:text-[#C0C0C8]">
							{t("planCardDescription")}
						</p>
					</div>
				</div>
			),
		},
		{
			label: t("buildTab"),
			content: (
				<div className="space-y-6">
					<CodeBlock code={buildCode} language="bash" />
					<div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1A1A2E]/60 p-6">
						<h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
							{t("buildCardTitle")}
						</h3>
						<p className="text-sm leading-relaxed text-gray-700 dark:text-[#C0C0C8]">
							{t("buildCardDescription")}
						</p>
					</div>
				</div>
			),
		},
		{
			label: t("shipTab"),
			content: (
				<div className="space-y-6">
					<CodeBlock code={shipCode} language="bash" />
					<div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1A1A2E]/60 p-6">
						<h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
							{t("shipCardTitle")}
						</h3>
						<p className="text-sm leading-relaxed text-gray-700 dark:text-[#C0C0C8]">
							{t("shipCardDescription")}
						</p>
					</div>
				</div>
			),
		},
	];

	return (
		<section className="py-24 px-4">
			<div className="mx-auto max-w-5xl">
				<div className="mb-14 text-center">
					<h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
						<TextAnimate animation="slideUp">{t("heading")}</TextAnimate>
					</h2>
					<p className="mx-auto max-w-xl text-gray-700 dark:text-[#C0C0C8]">
						{t("subheading")}
					</p>
				</div>
				<DirectionAwareTabs tabs={tabs} />
			</div>
		</section>
	);
}
