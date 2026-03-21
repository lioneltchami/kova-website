"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BgAnimateButton } from "@/components/ui/bg-animate-button";
import { CanvasFractalGrid } from "@/components/ui/canvas-fractal-grid";
import { GradientHeading } from "@/components/ui/gradient-heading";

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

export function CTA() {
  const t = useTranslations("cta");

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

      <motion.div
        className="relative z-10 mx-auto max-w-3xl text-center"
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <GradientHeading
          as="h2"
          className="mb-4 text-3xl font-bold sm:text-4xl"
          gradient={{ from: "#C0C0C8", to: "#4361EE" }}
        >
          {t("heading")}
        </GradientHeading>

        <p className="mb-10 text-lg text-gray-700 dark:text-kova-silver">
          {t("subheading")}
        </p>

        <motion.div
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <CopyInstallButton />

          <BgAnimateButton
            href="https://github.com/lioneltchami/kova-cli"
            variant="secondary"
          >
            <Star size={16} />
            {t("starOnGithub")}
          </BgAnimateButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
