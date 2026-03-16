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
    "bg-gradient-to-r from-kova-blue via-kova-blue-light to-kova-blue bg-[length:200%_100%] animate-[bg-shift_3s_ease_infinite] text-white",
  secondary:
    "bg-gradient-to-r from-kova-charcoal via-[#2a2a4e] to-kova-charcoal bg-[length:200%_100%] animate-[bg-shift_3s_ease_infinite] text-kova-silver border border-kova-blue/40",
  ghost:
    "bg-gradient-to-r from-transparent via-kova-blue/10 to-transparent bg-[length:200%_100%] animate-[bg-shift_3s_ease_infinite] text-kova-silver border border-kova-border",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-kova-charcoal";

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
    focusRing,
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
