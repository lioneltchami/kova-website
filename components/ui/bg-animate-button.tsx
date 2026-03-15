"use client";

import { cn } from "@/lib/utils";

interface BgAnimateButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
}

const variants = {
  primary:
    "bg-gradient-to-r from-[#4361EE] via-[#7B8FFF] to-[#4361EE] bg-[length:200%_100%] animate-[bg-shift_3s_ease_infinite] text-white",
  secondary:
    "bg-gradient-to-r from-[#1A1A2E] via-[#2a2a4e] to-[#1A1A2E] bg-[length:200%_100%] animate-[bg-shift_3s_ease_infinite] text-[#C0C0C8] border border-[#4361EE]/40",
  ghost:
    "bg-gradient-to-r from-transparent via-[#4361EE]/10 to-transparent bg-[length:200%_100%] animate-[bg-shift_3s_ease_infinite] text-[#C0C0C8] border border-white/10",
};

export function BgAnimateButton({
  children,
  href,
  variant = "primary",
  className,
  onClick,
}: BgAnimateButtonProps) {
  const classes = cn(
    "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all",
    "hover:scale-105 active:scale-95",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
