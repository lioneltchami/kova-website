"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShiftCardProps {
  title: string;
  icon?: React.ReactNode;
  hoverContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ShiftCard({
  title,
  icon,
  hoverContent,
  children,
  className,
}: ShiftCardProps) {
  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A2E] p-6 cursor-pointer",
        className,
      )}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative z-10 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2">
        {icon && <div className="mb-4 text-[#4361EE]">{icon}</div>}
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <div className="text-sm text-[#C0C0C8]">{children}</div>
      </div>

      {hoverContent && (
        <div className="absolute inset-0 z-20 flex flex-col justify-center p-6 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          <div className="text-sm text-[#C0C0C8]">{hoverContent}</div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-[#4361EE]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}
