"use client";

import { ArrowRight, Check, Copy, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  description: string;
  commands: Array<{ label: string; code: string }>;
  note?: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: "Install Kova CLI",
    description:
      "Install the Kova command-line tool globally via npm. This gives you the kova command in your terminal.",
    commands: [{ label: "Install", code: "npm install -g kova-cli" }],
    note: "Requires Node.js 18 or later.",
  },
  {
    number: 2,
    title: "Track your first session",
    description:
      "Run kova track to scan your local AI tool activity. Kova reads usage logs from Cursor, Copilot, Windsurf, and other tools.",
    commands: [
      { label: "Scan AI tool usage", code: "kova track" },
      {
        label: "Expected output",
        code: "Found 47 sessions across 3 tools\nCursor: $12.40  Copilot: $4.20  Windsurf: $1.80",
      },
    ],
  },
  {
    number: 3,
    title: "Connect to dashboard",
    description:
      "Authenticate and sync your usage data to your Kova dashboard. Your API key is on the Settings page.",
    commands: [
      { label: "Authenticate", code: "kova login" },
      { label: "Upload data", code: "kova sync" },
    ],
    note: "Your API key can be found on the Settings page.",
  },
];

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 p-1.5 rounded text-kova-silver-dim hover:text-kova-silver hover:bg-kova-charcoal transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check size={13} className="text-green-400" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
}

function StepIndicator({
  steps,
  currentStep,
}: {
  steps: Step[];
  currentStep: number;
}) {
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                currentStep > step.number
                  ? "bg-kova-blue text-white"
                  : currentStep === step.number
                    ? "border-2 border-kova-blue text-kova-blue bg-transparent ring-4 ring-kova-blue/10"
                    : "border-2 border-kova-border text-kova-silver-dim bg-transparent",
              )}
            >
              {currentStep > step.number ? <Check size={15} /> : step.number}
            </div>
            <span
              className={cn(
                "text-xs mt-1.5 font-medium whitespace-nowrap",
                currentStep === step.number
                  ? "text-white"
                  : currentStep > step.number
                    ? "text-kova-blue"
                    : "text-kova-silver-dim",
              )}
            >
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-20 mx-3 mb-5 transition-colors",
                currentStep > step.number ? "bg-kova-blue" : "bg-kova-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const step = STEPS[currentStep - 1];
  const isLastStep = currentStep === STEPS.length;

  function handleNext() {
    if (isLastStep) {
      router.push("/dashboard");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-kova-blue/20 mb-4">
          <Terminal size={22} className="text-kova-blue" />
        </div>
        <h1 className="text-2xl font-bold text-white">Set up Kova CLI</h1>
        <p className="text-sm text-kova-silver-dim mt-1.5">
          Connect your AI tools to start tracking costs
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStep={currentStep} />

      <div className="bg-kova-surface border border-kova-border rounded-xl p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-kova-blue">
              Step {step.number} of {STEPS.length}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {step.title}
          </h2>
          <p className="text-sm text-kova-silver-dim leading-relaxed">
            {step.description}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {step.commands.map((cmd) => (
            <div key={cmd.label}>
              <p className="text-xs text-kova-silver-dim mb-1.5">{cmd.label}</p>
              <div className="flex items-start gap-2 bg-kova-charcoal rounded-lg px-3.5 py-3 border border-kova-border/60">
                <code className="flex-1 text-sm font-mono text-kova-blue whitespace-pre overflow-x-auto">
                  {cmd.code}
                </code>
                <CopyButton code={cmd.code} />
              </div>
            </div>
          ))}
        </div>

        {step.note && (
          <div className="rounded-lg bg-kova-blue/5 border border-kova-blue/20 px-4 py-3 mb-6">
            <p className="text-xs text-kova-silver-dim">
              <span className="text-kova-blue font-semibold">Note: </span>
              {step.note}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-kova-border">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm text-kova-silver-dim hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors"
          >
            {isLastStep ? (
              <>Complete setup</>
            ) : (
              <>
                Next
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-kova-silver-dim mt-6">
        You can revisit these steps any time from{" "}
        <a
          href="/dashboard/settings"
          className="text-kova-blue hover:underline"
        >
          Settings
        </a>
        .
      </p>
    </div>
  );
}
