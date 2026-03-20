"use client";

import Link from "next/link";

interface EmptyStateProps {
	icon?: React.ReactNode;
	title: string;
	description: string;
	ctaText?: string;
	ctaHref?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	ctaText,
	ctaHref,
}: EmptyStateProps) {
	return (
		<div className="bg-kova-surface border border-kova-border rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[240px]">
			{icon && <div className="mb-4 text-kova-silver-dim">{icon}</div>}
			<h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
			<p className="text-sm text-kova-silver-dim max-w-md">{description}</p>
			{ctaText && ctaHref && (
				<Link
					href={ctaHref}
					className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-kova-blue text-white text-sm font-medium hover:bg-kova-blue-light transition-colors"
				>
					{ctaText}
				</Link>
			)}
		</div>
	);
}
