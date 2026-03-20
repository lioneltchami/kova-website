"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { BgAnimateButton } from "@/components/ui/bg-animate-button";
import { CanvasFractalGrid } from "@/components/ui/canvas-fractal-grid";
import { GradientHeading } from "@/components/ui/gradient-heading";

function CopyInstallButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText("npx kova-cli init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="relative inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-kova-blue to-kova-blue-light text-white font-semibold text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-kova-charcoal"
    >
      {copied ? (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <span className="font-mono">npx kova-cli init</span>
          <svg
            className="w-4 h-4 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </>
      )}
    </button>
  );
}

export function CTA() {
  return (
    <section className="relative py-32 px-4 overflow-hidden">
      <div className="absolute inset-0">
        <CanvasFractalGrid
          dotColor="#C0C0C8"
          glowColor="#4361EE"
          backgroundColor="transparent"
          dotSpacing={32}
          dotRadius={1.2}
          rippleRadius={120}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 dark:via-kova-charcoal/60 to-white dark:to-kova-charcoal" />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <GradientHeading
          as="h2"
          className="mb-4 text-3xl font-bold sm:text-4xl"
          gradient={{ from: "#C0C0C8", to: "#4361EE" }}
        >
          Join the Pack
        </GradientHeading>

        <p className="mb-10 text-lg text-gray-700 dark:text-kova-silver">
          Open source. Free forever. Ship faster.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <CopyInstallButton />

          <BgAnimateButton
            href="https://github.com/lioneltchami/kova-cli"
            variant="secondary"
          >
            <Star size={16} />
            Star on GitHub
          </BgAnimateButton>
        </div>
      </div>
    </section>
  );
}
