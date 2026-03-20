"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface RealtimeUsageProviderProps {
	userId: string;
	initialRecords: any[];
	children: (records: any[]) => React.ReactNode;
}

export function RealtimeUsageProvider({
	userId,
	initialRecords,
	children,
}: RealtimeUsageProviderProps) {
	const [records, setRecords] = useState(initialRecords);

	useEffect(() => {
		const supabase = createClient();
		const channel = supabase
			.channel("usage-live")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "usage_records",
					filter: `user_id=eq.${userId}`,
				},
				(payload) => {
					setRecords((prev) => {
						const ids = new Set(prev.map((r: any) => r.id));
						if (ids.has(payload.new.id)) return prev;
						return [payload.new, ...prev].slice(0, 50);
					});
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId]);

	useEffect(() => {
		setRecords(initialRecords);
	}, [initialRecords]);

	return <>{children(records)}</>;
}
