"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface RealtimeUsageProviderProps {
	userId: string;
	initialRecords: any[];
	children: (records: any[], isLive: boolean) => React.ReactNode;
}

export function RealtimeUsageProvider({
	userId,
	initialRecords,
	children,
}: RealtimeUsageProviderProps) {
	const [records, setRecords] = useState(initialRecords);
	const [isLive, setIsLive] = useState(false);

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
			.subscribe((status) => {
				setIsLive(status === "SUBSCRIBED");
			});

		return () => {
			supabase.removeChannel(channel);
			setIsLive(false);
		};
	}, [userId]);

	useEffect(() => {
		setRecords(initialRecords);
	}, [initialRecords]);

	return <>{children(records, isLive)}</>;
}
