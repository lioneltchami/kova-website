"use client";

import { X, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface UpgradeNudgeProps {
  id: string;
  message: string;
  ctaText: string;
  ctaHref: string;
  plan: string;
}

export function UpgradeNudge({
  id,
  message,
  ctaText,
  ctaHref,
  plan,
}: UpgradeNudgeProps) {
  const [visible, setVisible] = useState(false);

  // Don't show for paid plans
  const isPaidPlan = plan === "pro" || plan === "team" || plan === "enterprise";

  useEffect(() => {
    if (isPaidPlan) return;

    const storageKey = `nudge-dismissed-${id}`;
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DURATION_MS) {
        return;
      }
    }
    setVisible(true);
  }, [id, isPaidPlan]);

  if (!visible || isPaidPlan) return null;

  function handleDismiss() {
    const storageKey = `nudge-dismissed-${id}`;
    localStorage.setItem(storageKey, String(Date.now()));
    setVisible(false);
  }

  return (
    <div className="flex items-center gap-3 border-l-4 border-kova-blue bg-kova-surface/50 rounded-r-lg px-4 py-3 mb-5">
      <Zap size={15} className="text-kova-blue flex-shrink-0" />
      <p className="text-sm text-kova-silver flex-1">{message}</p>
      <Link
        href={ctaHref}
        className="text-xs font-medium text-kova-blue hover:text-kova-blue-light transition-colors flex-shrink-0 whitespace-nowrap"
      >
        {ctaText}
      </Link>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="text-kova-silver-dim hover:text-kova-silver transition-colors flex-shrink-0 ml-1"
      >
        <X size={14} />
      </button>
    </div>
  );
}
