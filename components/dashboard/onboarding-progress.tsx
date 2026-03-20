"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  label: string;
  description: string;
  command: string;
  complete: boolean;
}

interface OnboardingProgressProps {
  cliInstalled: boolean;
  hasUsage: boolean;
  hasSynced: boolean;
}

export function OnboardingProgress({
  cliInstalled,
  hasUsage,
  hasSynced,
}: OnboardingProgressProps) {
  const steps: OnboardingStep[] = [
    {
      label: "Install CLI",
      description: "Install the Kova command-line tool",
      command: "npm install -g kova-cli",
      complete: cliInstalled,
    },
    {
      label: "Track usage",
      description: "Scan your AI tool activity",
      command: "kova track",
      complete: hasUsage,
    },
    {
      label: "Sync to dashboard",
      description: "Upload your data to see insights here",
      command: "kova sync",
      complete: hasSynced,
    },
  ];

  const completedCount = steps.filter((s) => s.complete).length;

  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-white">
            Getting started
          </h2>
          <p className="text-xs text-kova-silver-dim mt-0.5">
            {completedCount} of {steps.length} steps complete
          </p>
        </div>
        <div className="flex items-center gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === 0 ? "w-8" : "w-4",
                steps[i].complete ? "bg-kova-blue" : "bg-kova-charcoal-light",
              )}
            />
          ))}
        </div>
      </div>

      {/* Horizontal steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {steps.map((step, index) => {
          const isComplete = step.complete;
          const isActive =
            !isComplete && (index === 0 || steps[index - 1].complete);

          return (
            <div
              key={step.label}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                isComplete
                  ? "border-kova-blue/30 bg-kova-blue/5"
                  : isActive
                    ? "border-kova-border bg-kova-charcoal-light/40"
                    : "border-kova-border/50 bg-transparent opacity-50",
              )}
            >
              {/* Step number / check */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0",
                    isComplete
                      ? "bg-kova-blue text-white"
                      : isActive
                        ? "border-2 border-kova-blue text-kova-blue bg-transparent"
                        : "border-2 border-kova-border text-kova-silver-dim bg-transparent",
                  )}
                >
                  {isComplete ? <Check size={13} /> : index + 1}
                </div>
                <span className="text-sm font-medium text-white">
                  {step.label}
                </span>
              </div>

              <p className="text-xs text-kova-silver-dim mb-3">
                {step.description}
              </p>

              {/* Inline code block */}
              <code className="block w-full text-xs font-mono bg-kova-charcoal rounded px-2.5 py-2 text-kova-blue overflow-x-auto">
                {step.command}
              </code>
            </div>
          );
        })}
      </div>
    </div>
  );
}
