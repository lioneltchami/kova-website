"use client";

interface StripeBgGuidesProps {
  color?: string;
  count?: number;
  className?: string;
}

export function StripeBgGuides({
  color = "#4361EE",
  count = 6,
  className = "",
}: StripeBgGuidesProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes glow-travel {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200vh); }
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-px opacity-20"
          style={{
            left: `${((i + 1) / (count + 1)) * 100}%`,
            backgroundColor: color,
          }}
        >
          <div
            className="w-full h-24 opacity-80"
            style={{
              background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
              animation: `glow-travel ${3 + i * 0.7}s linear infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
