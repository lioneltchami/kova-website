"use client";

import { cn } from "@/lib/utils";

interface GradientHeadingProps {
	children: React.ReactNode;
	className?: string;
	gradient?: {
		from: string;
		to: string;
		via?: string;
	};
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "p";
}

export function GradientHeading({
	children,
	className,
	gradient = { from: "#4361EE", to: "#C0C0C8" },
	as: Tag = "h2",
}: GradientHeadingProps) {
	const gradientStyle = gradient.via
		? {
				backgroundImage: `linear-gradient(to right, ${gradient.from}, ${gradient.via}, ${gradient.to})`,
			}
		: {
				backgroundImage: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
			};

	return (
		<Tag
			className={cn("bg-clip-text text-transparent inline-block", className)}
			style={gradientStyle}
		>
			{children}
		</Tag>
	);
}
