"use client";

import { cn } from "@/lib/utils";

interface CosmicButtonProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
  onClick?: () => void;
}

export function CosmicButton({
  children,
  href,
  className,
  onClick,
}: CosmicButtonProps) {
  const inner = (
    <span className="relative z-10 flex items-center gap-2 rounded-[inherit] px-6 py-3 bg-[#1A1A2E] text-white text-sm font-medium transition-colors group-hover:bg-[#1A1A2E]/80">
      {children}
    </span>
  );

  const classes = cn(
    "group relative inline-flex rounded-xl p-[2px] overflow-hidden",
    "before:absolute before:inset-0 before:rounded-xl",
    "before:bg-[conic-gradient(from_var(--angle),#4361EE,#C0C0C8,#4361EE,#1A1A2E,#4361EE)]",
    "before:[--angle:0deg] before:animate-[spin_3s_linear_infinite]",
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {inner}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {inner}
    </button>
  );
}
