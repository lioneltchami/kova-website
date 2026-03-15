"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";

const stats = [
  { value: 415, suffix: "+", label: "Tests Passing" },
  { value: 11, suffix: "", label: "Commands Available" },
  { value: 6, suffix: "", label: "Plan Templates" },
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
