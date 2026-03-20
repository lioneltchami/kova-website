"use client";

import { ChevronDown } from "lucide-react";

interface CostCenter {
	id: string;
	name: string;
}

interface CostCenterSelectorProps {
	costCenters: CostCenter[];
	selected?: string;
	onChange: (id: string) => void;
}

export function CostCenterSelector({
	costCenters,
	selected,
	onChange,
}: CostCenterSelectorProps) {
	return (
		<div className="relative inline-block">
			<select
				value={selected ?? ""}
				onChange={(e) => onChange(e.target.value)}
				className="appearance-none bg-kova-charcoal-light border border-kova-border rounded-lg px-3 py-2 pr-8 text-sm text-kova-silver focus:outline-none focus:ring-1 focus:ring-kova-blue transition-colors hover:border-kova-blue/50"
			>
				<option value="">All Cost Centers</option>
				{costCenters.map((cc) => (
					<option key={cc.id} value={cc.id}>
						{cc.name}
					</option>
				))}
			</select>
			<ChevronDown
				size={14}
				className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kova-silver-dim pointer-events-none"
			/>
		</div>
	);
}
