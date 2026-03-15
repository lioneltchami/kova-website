"use client";

import { cn } from "@/lib/utils";

interface NeumorphEyebrowProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning";
  className?: string;
}

const variants = {
  default: {
    bg: "bg-[#1A1A2E]",
    text: "text-[#C0C0C8]",
    shadow:
      "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]",
  },
  primary: {
    bg: "bg-[#1a1f3e]",
    text: "text-[#4361EE]",
    shadow:
      "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(67,97,238,0.1)]",
  },
  success: {
    bg: "bg-[#0d1f1a]",
    text: "text-emerald-400",
    shadow:
      "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(52,211,153,0.1)]",
  },
  warning: {
    bg: "bg-[#1f1a0d]",
    text: "text-amber-400",
    shadow:
      "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(251,191,36,0.1)]",
  },
};

export function NeumorphEyebrow({
  children,
  variant = "default",
  className,
}: NeumorphEyebrowProps) {
  const v = variants[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase",
        v.bg,
        v.text,
        v.shadow,
        className,
      )}
    >
      {children}
    </span>
  );
}
