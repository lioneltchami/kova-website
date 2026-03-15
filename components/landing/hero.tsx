"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { WolfLogo } from "@/components/landing/wolf-logo";
import { BgAnimateButton } from "@/components/ui/bg-animate-button";
import { CanvasFractalGrid } from "@/components/ui/canvas-fractal-grid";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { NeumorphEyebrow } from "@/components/ui/neumorph-eyebrow";
import { TerminalAnimation } from "@/components/ui/terminal-animation";
import { Typewriter } from "@/components/ui/typewriter";

function CopyInstallButton() {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText("npx kova-cli init");
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<button
			onClick={handleCopy}
			className="relative inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#4361EE] to-[#5B7BFF] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
		>
			{copied ? (
				<>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 13l4 4L19 7"
						/>
					</svg>
					Copied!
				</>
			) : (
				<>
					<span className="font-mono">npx kova-cli init</span>
					<svg
						className="w-4 h-4 opacity-60"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
				</>
			)}
		</button>
	);
}

const TERMINAL_SCENARIOS = [
	{
		title: "Plan",
		steps: [
			{
				command: 'kova plan "add user authentication"',
				output: "Planning... (using opus model)",
			},
			{
				command: "Analyzing codebase structure...",
				output: "Plan created: .claude/tasks/user-auth.md",
			},
			{
				command: "Generating task graph...",
				output:
					"Tasks: 7 | Agents: 4 | Est. models: 2x haiku, 3x sonnet, 1x opus",
			},
		],
	},
	{
		title: "Build",
		steps: [
			{
				command: "kova build --live",
				output: "Building: user-auth",
			},
			{
				command: "Dispatching agents...",
				output: "[=====>          ] 3/7 tasks (42%)",
			},
			{
				command: "[done]  setup-schema       haiku   47s",
				output: "[done]  build-api          sonnet  2m 18s",
			},
			{
				command: "[running] integration-tests  sonnet",
				output: "Validation in progress...",
			},
		],
	},
	{
		title: "Ship",
		steps: [
			{
				command: "kova pr",
				output: "Creating PR: Add User Authentication",
			},
			{
				command: "Branch: feat/user-auth -> main",
				output: "PR #42 created: github.com/org/repo/pull/42",
			},
		],
	},
];

export function Hero() {
	const ref = useRef(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start start", "end start"],
	});
	const wolfY = useTransform(scrollYProgress, [0, 1], [0, 150]);

	return (
		<section
			ref={ref}
			className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
		>
			{/* Parallax wolf silhouette */}
			<motion.div
				style={{ y: wolfY }}
				className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1] opacity-[0.03]"
			>
				<WolfLogo size={500} />
			</motion.div>

			{/* Background: Canvas Fractal Grid */}
			<div className="absolute inset-0 pointer-events-none">
				<CanvasFractalGrid
					dotColor="#C0C0C8"
					glowColor="#4361EE"
					backgroundColor="transparent"
					dotSpacing={32}
					dotRadius={1.2}
					rippleRadius={120}
					className="w-full h-full"
				/>
			</div>

			{/* Radial gradient vignette to focus center content */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, #1A1A2E 75%)",
				}}
			/>

			{/* Content */}
			<div className="relative z-10 text-center max-w-4xl mx-auto pt-20 pb-16">
				{/* Badge */}
				<div className="mb-6 flex justify-center">
					<NeumorphEyebrow variant="primary">
						v1.0 -- Open Source
					</NeumorphEyebrow>
				</div>

				{/* Main Heading */}
				<h1 className="mb-3 leading-tight">
					<GradientHeading
						as="span"
						className="block text-5xl sm:text-6xl md:text-7xl font-bold"
						gradient={{ from: "#C0C0C8", to: "#4361EE" }}
					>
						Plan the hunt.
					</GradientHeading>
					<GradientHeading
						as="span"
						className="block text-5xl sm:text-6xl md:text-7xl font-bold"
						gradient={{ from: "#C0C0C8", to: "#4361EE" }}
					>
						Run the pack.
					</GradientHeading>
				</h1>

				{/* Subtitle typewriter */}
				<div className="mt-6 mb-10 text-lg sm:text-xl text-kova-silver-dim min-h-[2rem]">
					<Typewriter
						phrases={[
							"Multi-agent AI orchestration for your codebase.",
							"17 specialist agents. One CLI command.",
							"Plan before you code. Validate independently.",
						]}
						typingSpeed={55}
						deletingSpeed={25}
						pauseDuration={2000}
						className="font-mono"
					/>
				</div>

				{/* Terminal Demo */}
				<div className="mb-10 mx-auto max-w-2xl">
					<TerminalAnimation
						scenarios={TERMINAL_SCENARIOS}
						className="text-left shadow-2xl shadow-kova-blue/10"
					/>
				</div>

				{/* CTAs */}
				<div className="flex flex-wrap gap-4 justify-center" id="quickstart">
					<CopyInstallButton />
					<BgAnimateButton href="/docs" variant="ghost">
						Read the Docs
					</BgAnimateButton>
				</div>

				{/* Subtle stats row */}
				<div className="mt-14 flex flex-wrap justify-center gap-8 text-sm text-kova-silver-dim">
					{[
						["17+", "Specialist Agents"],
						["11", "CLI Commands"],
						["6", "Plan Templates"],
						["3x", "Model Tiers"],
					].map(([num, label]) => (
						<div key={label} className="flex flex-col items-center gap-0.5">
							<span className="text-2xl font-bold text-kova-blue">{num}</span>
							<span className="tracking-wide uppercase text-xs">{label}</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
