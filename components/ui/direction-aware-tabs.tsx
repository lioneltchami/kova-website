"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface DirectionAwareTabsProps {
  tabs: Tab[];
  className?: string;
}

export function DirectionAwareTabs({
  tabs,
  className,
}: DirectionAwareTabsProps) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  function handleSelect(index: number) {
    setDirection(index > active ? 1 : -1);
    setActive(index);
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex gap-1 rounded-xl bg-[#0d0d0d] p-1 border border-white/10 mb-6">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={cn(
              "relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              i === active ? "text-white" : "text-[#C0C0C8] hover:text-white",
            )}
          >
            {i === active && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-lg bg-[#4361EE]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={active}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.25 }}
          >
            {tabs[active].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
