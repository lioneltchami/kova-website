interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export function KpiCard({ label, value, subtitle }: KpiCardProps) {
  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
      <p className="text-xs text-kova-silver-dim uppercase tracking-wider">
        {label}
      </p>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
      {subtitle && (
        <p className="text-sm text-kova-silver-dim mt-1">{subtitle}</p>
      )}
    </div>
  );
}
