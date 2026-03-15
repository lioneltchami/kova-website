"use client";

import {
	BarChart3,
	GitBranch,
	Github,
	Layers,
	ShieldCheck,
	Users,
} from "lucide-react";
import { ShiftCard } from "@/components/ui/shift-card";
import { StripeBgGuides } from "@/components/ui/stripe-bg-guides";
import { TextAnimate } from "@/components/ui/text-animate";

const features = [
	{
		title: "17+ Specialist Agents",
		icon: <Users size={24} />,
		description:
			"Each agent is an expert in its domain: frontend, backend, database, security, quality, performance.",
		hover:
			"frontend-specialist, backend-engineer, database-architect, security-auditor, quality-engineer, performance-optimizer, and 11 more. Each one trained on its domain patterns.",
	},
	{
		title: "Dependency-Aware Execution",
		icon: <GitBranch size={24} />,
		description:
			"Tasks wait for prerequisites. No building on assumptions. Explicit task graphs.",
		hover:
			"Define task relationships with addBlockedBy and addBlocks. The hub orchestrator enforces order -- your frontend never starts before the API is validated.",
	},
	{
		title: "Model Tiering",
		icon: <Layers size={24} />,
		description:
			"Haiku for typos. Sonnet for features. Opus for architecture. 3-10x cost savings.",
		hover:
			"Auto-selects the right model per task. Trivial fixes use haiku ($0.25/M). Features use sonnet ($3/M). Architectural decisions get opus ($15/M). You only pay for what the task needs.",
	},
	{
		title: "Crash Recovery",
		icon: <ShieldCheck size={24} />,
		description:
			"Checkpoint every task. Resume with --resume. Never lose progress.",
		hover:
			"Every completed task writes a checkpoint. Rate limit? Power failure? Run kova build --resume and pick up exactly where you stopped. No wasted work.",
	},
	{
		title: "Token Budget Tracking",
		icon: <BarChart3 size={24} />,
		description: "Per-task and per-build token usage. Warnings at 80% and 95%.",
		hover:
			"Real-time token counters per agent. Session-level budget warnings at 80% and 95% thresholds. Know your costs before the bill arrives.",
	},
	{
		title: "GitHub Integration",
		icon: <Github size={24} />,
		description:
			"Auto-branches, issue linking, PR creation. Idea to merged PR.",
		hover:
			"kova pr creates a branch, writes a PR title and body, links related issues, and opens the PR -- all from the session context. Zero context switching.",
	},
];

export function Features() {
	return (
		<section className="relative py-24 px-4 overflow-hidden">
			<StripeBgGuides color="#4361EE" count={6} />

			<div className="relative z-10 mx-auto max-w-6xl">
				<div className="mb-14 text-center">
					<h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
						<TextAnimate animation="slideUp">
							Built for Developers Who Ship
						</TextAnimate>
					</h2>
					<p className="mx-auto max-w-xl text-[#C0C0C8]">
						Every feature is designed around one goal: getting correct,
						validated code merged -- faster.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature) => (
						<ShiftCard
							key={feature.title}
							title={feature.title}
							icon={feature.icon}
							hoverContent={
								<p className="text-sm leading-relaxed text-[#C0C0C8]">
									{feature.hover}
								</p>
							}
						>
							{feature.description}
						</ShiftCard>
					))}
				</div>
			</div>
		</section>
	);
}
