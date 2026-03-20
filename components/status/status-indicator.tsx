"use client";

export type StatusLevel = "healthy" | "degraded" | "down";

interface StatusIndicatorProps {
  status: StatusLevel;
  label?: string;
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<
  StatusLevel,
  { dot: string; text: string; label: string }
> = {
  healthy: {
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    label: "Operational",
  },
  degraded: {
    dot: "bg-amber-400",
    text: "text-amber-400",
    label: "Degraded",
  },
  down: {
    dot: "bg-red-500",
    text: "text-red-500",
    label: "Down",
  },
};

export function StatusIndicator({
  status,
  label,
  showLabel = true,
}: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.label;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block w-2 h-2 rounded-full ${config.dot} shrink-0`}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={`text-xs font-medium ${config.text}`}>
          {displayLabel}
        </span>
      )}
    </span>
  );
}
