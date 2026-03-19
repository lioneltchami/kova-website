"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

export type DateRange = "today" | "7d" | "30d";

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
	{ value: "today", label: "Today" },
	{ value: "7d", label: "7 Days" },
	{ value: "30d", label: "30 Days" },
];

interface DateRangePickerProps {
	paramKey?: string;
}

export function DateRangePicker({ paramKey = "range" }: DateRangePickerProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const current = (searchParams.get(paramKey) as DateRange) ?? "30d";

	const setRange = useCallback(
		(value: DateRange) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set(paramKey, value);
			router.push(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams, paramKey],
	);

	return (
		<div className="flex items-center gap-1 bg-kova-surface border border-kova-border rounded-lg p-1">
			{RANGE_OPTIONS.map((opt) => (
				<button
					key={opt.value}
					onClick={() => setRange(opt.value)}
					className={cn(
						"px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
						current === opt.value
							? "bg-kova-blue text-white"
							: "text-kova-silver-dim hover:text-kova-silver hover:bg-kova-charcoal-light/50",
					)}
				>
					{opt.label}
				</button>
			))}
		</div>
	);
}

export function getDateRangeStart(range: DateRange): Date {
	const now = new Date();
	switch (range) {
		case "today": {
			const d = new Date(now);
			d.setHours(0, 0, 0, 0);
			return d;
		}
		case "7d": {
			const d = new Date(now);
			d.setDate(d.getDate() - 7);
			return d;
		}
		case "30d":
		default: {
			const d = new Date(now);
			d.setDate(d.getDate() - 30);
			return d;
		}
	}
}
