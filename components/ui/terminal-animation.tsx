"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Step {
	command: string;
	output: string;
}

interface Scenario {
	title: string;
	steps: Step[];
}

interface TerminalAnimationProps {
	scenarios: Scenario[];
	className?: string;
}

export function TerminalAnimation({
	scenarios,
	className = "",
}: TerminalAnimationProps) {
	const [activeTab, setActiveTab] = useState(0);
	const [visibleSteps, setVisibleSteps] = useState<number>(0);
	const [typedChars, setTypedChars] = useState<number>(0);

	const current = scenarios[activeTab];

	useEffect(() => {
		setVisibleSteps(0);
		setTypedChars(0);
	}, [activeTab]);

	useEffect(() => {
		if (!current) return;
		const step = current.steps[visibleSteps];
		if (!step) return;

		if (typedChars < step.command.length) {
			const t = setTimeout(() => setTypedChars((c) => c + 1), 40);
			return () => clearTimeout(t);
		}

		if (visibleSteps < current.steps.length - 1) {
			const t = setTimeout(() => {
				setVisibleSteps((s) => s + 1);
				setTypedChars(0);
			}, 800);
			return () => clearTimeout(t);
		}
	}, [typedChars, visibleSteps, current]);

	return (
		<div
			className={`rounded-xl overflow-hidden border border-white/10 bg-[#0d0d0d] font-mono text-sm ${className}`}
		>
			<div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
				<span className="w-3 h-3 rounded-full bg-red-500" />
				<span className="w-3 h-3 rounded-full bg-yellow-400" />
				<span className="w-3 h-3 rounded-full bg-green-500" />
				<div className="ml-4 flex gap-2">
					{scenarios.map((s, i) => (
						<button
							key={i}
							onClick={() => setActiveTab(i)}
							className={`px-3 py-1 rounded text-xs transition-colors ${
								i === activeTab
									? "bg-[#4361EE] text-white"
									: "text-[#C0C0C8] hover:text-white"
							}`}
						>
							{s.title}
						</button>
					))}
				</div>
			</div>
			<div className="p-4 min-h-[200px] space-y-3">
				{current.steps.slice(0, visibleSteps + 1).map((step, i) => (
					<div key={i}>
						<div className="flex items-center gap-2 text-[#4361EE]">
							<span className="text-[#C0C0C8]">$</span>
							<span>
								{i < visibleSteps
									? step.command
									: step.command.slice(0, typedChars)}
								{i === visibleSteps && typedChars < step.command.length && (
									<span className="animate-pulse">|</span>
								)}
							</span>
						</div>
						{i < visibleSteps && (
							<AnimatePresence>
								<motion.div
									initial={{ opacity: 0, y: 4 }}
									animate={{ opacity: 1, y: 0 }}
									className="mt-1 text-[#C0C0C8] pl-4"
								>
									{step.output}
								</motion.div>
							</AnimatePresence>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
