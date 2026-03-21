"use client";

import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { WolfLogo } from "@/components/landing/wolf-logo";
import { BgAnimateButton } from "@/components/ui/bg-animate-button";
import { CanvasFractalGrid } from "@/components/ui/canvas-fractal-grid";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { NeumorphEyebrow } from "@/components/ui/neumorph-eyebrow";
import { TerminalAnimation } from "@/components/ui/terminal-animation";
import { Typewriter } from "@/components/ui/typewriter";

const heroContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function CopyInstallButton() {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("common");

  const handleCopy = async () => {
    await navigator.clipboard.writeText("npx kova-cli init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.95 }}
      animate={copied ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
      className="relative inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-kova-blue to-kova-blue-light text-white font-semibold text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-kova-charcoal"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-2"
          >
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
            {t("copied")}
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-2"
          >
            <span className="font-mono">{t("copyInstall")}</span>
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
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

const TERMINAL_SCENARIOS = [
  {
    title: "Track",
    steps: [
      {
        command: "kova track",
        output: "Scanning AI tool usage...",
      },
      {
        command: "  claude-code   found ~/.claude/usage.jsonl",
        output: "  cursor        found ~/.cursor/usage.log",
      },
      {
        command: "  copilot       found ~/.config/copilot/telemetry.json",
        output: "  windsurf      found ~/.windsurf/sessions/",
      },
      {
        command: "Collected 47 records across 4 tools",
        output: "Run: kova costs to see breakdown",
      },
    ],
  },
  {
    title: "Costs",
    steps: [
      {
        command: "kova costs --week",
        output: "AI spend for the last 7 days:",
      },
      {
        command: "  claude-code   $12.40   (tokens: 4.1M)",
        output: "  cursor        $4.20    (requests: 312)",
      },
      {
        command: "  copilot       $0.00    (subscription)",
        output: "  windsurf      $2.80    (tokens: 890K)",
      },
      {
        command: "  Total         $19.40",
        output: "Budget used: 64% of $30/week",
      },
    ],
  },
  {
    title: "Sync",
    steps: [
      {
        command: "kova sync",
        output: "Uploading to dashboard...",
      },
      {
        command: "  Local records: 47  |  Already synced: 32",
        output: "  Uploading: 15 records",
      },
      {
        command: "Sync complete",
        output: "Dashboard: https://kova.dev/dashboard",
      },
    ],
  },
];

export function Hero() {
  const t = useTranslations("hero");
  const tCommon = useTranslations("common");
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const wolfY = useTransform(scrollYProgress, [0, 1], [0, 150]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
    >
      {/* Parallax wolf silhouette -- visible watermark */}
      <motion.div
        style={{ y: wolfY }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]"
      >
        <div
          className="opacity-[0.08]"
          style={{ filter: "drop-shadow(0 0 40px rgba(67, 97, 238, 0.3))" }}
        >
          <WolfLogo size={600} />
        </div>
      </motion.div>

      {/* Background: Canvas Fractal Grid */}
      <div className="absolute inset-0 pointer-events-none">
        <CanvasFractalGrid
          dotColor="#C0C0C8"
          glowColor="#4361EE"
          backgroundColor="transparent"
          dotSpacing={32}
          dotRadius={1.2}
          rippleRadius={120}
          className="w-full h-full"
        />
      </div>

      {/* Radial gradient vignette to focus center content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, #1A1A2E 75%)",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-4xl mx-auto pt-20 pb-16"
        variants={heroContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div className="mb-6 flex justify-center" variants={heroItem}>
          <NeumorphEyebrow variant="primary">{t("badge")}</NeumorphEyebrow>
        </motion.div>

        {/* Main Heading */}
        <motion.h1 className="mb-3 leading-tight" variants={heroItem}>
          <GradientHeading
            as="span"
            className="block text-5xl sm:text-6xl md:text-7xl font-bold"
            gradient={{ from: "#C0C0C8", to: "#4361EE" }}
          >
            {t("headline1")}
          </GradientHeading>
          <GradientHeading
            as="span"
            className="block text-5xl sm:text-6xl md:text-7xl font-bold"
            gradient={{ from: "#C0C0C8", to: "#4361EE" }}
          >
            {t("headline2")}
          </GradientHeading>
        </motion.h1>

        {/* Subtitle typewriter */}
        <motion.div
          className="mt-6 mb-10 text-lg sm:text-xl text-gray-500 dark:text-kova-silver-dim min-h-[2rem]"
          variants={heroItem}
        >
          <Typewriter
            phrases={[t("phrase1"), t("phrase2"), t("phrase3")]}
            typingSpeed={55}
            deletingSpeed={25}
            pauseDuration={2000}
            className="font-mono"
          />
        </motion.div>

        {/* Terminal Demo */}
        <motion.div
          className="mb-10 mx-auto max-w-2xl"
          variants={heroItem}
        >
          <TerminalAnimation
            scenarios={TERMINAL_SCENARIOS}
            className="text-left shadow-2xl shadow-kova-blue/10"
          />
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center"
          id="quickstart"
          variants={heroItem}
        >
          <CopyInstallButton />
          <BgAnimateButton href="/docs" variant="ghost">
            {tCommon("readTheDocs")}
          </BgAnimateButton>
        </motion.div>

        {/* Subtle stats row */}
        <motion.div
          className="mt-14 flex flex-wrap justify-center gap-8 text-sm text-gray-500 dark:text-kova-silver-dim"
          variants={heroItem}
        >
          {[
            { value: t("stat1Value"), label: t("stat1Label") },
            { value: t("stat2Value"), label: t("stat2Label") },
            { value: t("stat3Value"), label: t("stat3Label") },
            { value: t("stat4Value"), label: t("stat4Label") },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-0.5"
            >
              <span className="text-2xl font-bold text-kova-blue">
                {stat.value}
              </span>
              <span className="tracking-wide uppercase text-xs">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
