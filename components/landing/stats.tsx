"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";

const stats = [
  { value: 5, suffix: "", label: "AI Tools Tracked" },
  { value: 12, suffix: "+", label: "Cost Metrics" },
  { value: 100, suffix: "%", label: "Usage Visibility" },
];

export function Stats() {
  return (
    <section className="py-20 px-4 bg-[#1A1A2E]/60">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-2 text-5xl font-bold tabular-nums text-white sm:text-6xl">
                <AnimatedNumber
                  value={stat.value}
                  suffix={stat.suffix}
                  duration={1.8}
                />
              </div>
              <div className="text-sm font-medium uppercase tracking-widest text-[#C0C0C8]/60">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
