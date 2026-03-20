"use client";

interface RoiCardProps {
  totalCost: number;
  activeDays: number;
  totalSessions: number;
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export function RoiCard({
  totalCost,
  activeDays,
  totalSessions,
}: RoiCardProps) {
  const costPerDay = activeDays > 0 ? totalCost / activeDays : 0;
  const costPerSession = totalSessions > 0 ? totalCost / totalSessions : 0;
  const avgDailySessions = activeDays > 0 ? totalSessions / activeDays : 0;

  const metrics = [
    {
      label: "Cost per active day",
      value: formatCost(costPerDay),
      description: "Average spend on days you used AI tools",
    },
    {
      label: "Cost per session",
      value: formatCost(costPerSession),
      description: "Average cost for a single AI session",
    },
    {
      label: "Avg daily sessions",
      value: avgDailySessions.toFixed(1),
      description: "Sessions per active day on average",
    },
  ];

  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
      <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
        ROI Metrics
      </p>
      <p className="text-sm text-kova-silver-dim mb-5">
        Cost efficiency across your AI usage
      </p>
      <div className="space-y-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-kova-silver">{m.label}</p>
              <p className="text-xs text-kova-silver-dim mt-0.5">
                {m.description}
              </p>
            </div>
            <span className="text-xl font-bold text-white shrink-0">
              {m.value}
            </span>
          </div>
        ))}
      </div>
      {activeDays === 0 && (
        <p className="mt-4 text-xs text-kova-silver-dim text-center">
          No active days recorded in this period.
        </p>
      )}
    </div>
  );
}
