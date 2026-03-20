"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface IntegrationDisconnectButtonsProps {
	userId: string;
	type: "github" | "slack";
}

export function IntegrationDisconnectButtons({
	type,
}: IntegrationDisconnectButtonsProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleDisconnect() {
		if (
			!confirm(
				`Disconnect ${type === "github" ? "GitHub App" : "Slack"}? This cannot be undone.`,
			)
		)
			return;

		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/v1/integrations/disconnect", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type }),
			});
			if (res.ok) {
				router.refresh();
			} else {
				const data = await res.json();
				setError(data.error ?? "Failed to disconnect.");
			}
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-col items-end gap-1">
			<button
				onClick={handleDisconnect}
				disabled={loading}
				className="flex-shrink-0 px-3 py-1.5 border border-red-700/60 text-red-400 text-sm font-medium rounded-lg hover:border-red-500 hover:text-red-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
			>
				{loading ? "Disconnecting..." : "Disconnect"}
			</button>
			{error && <p className="text-xs text-red-400">{error}</p>}
		</div>
	);
}
