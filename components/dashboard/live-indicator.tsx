"use client";

export function LiveIndicator({ isLive }: { isLive: boolean }) {
	if (!isLive) return null;

	return (
		<span className="relative flex h-2 w-2" title="Live updates active">
			<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
			<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
		</span>
	);
}
