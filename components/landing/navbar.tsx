"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { WolfLogo } from "@/components/landing/wolf-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BgAnimateButton } from "@/components/ui/bg-animate-button";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-kova-charcoal";

export function Navbar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md bg-white/80 dark:bg-kova-charcoal/80 border-gray-200 dark:border-kova-border"
          : "backdrop-blur-none bg-transparent border-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className={`flex items-center gap-2 flex-shrink-0 rounded-md ${focusRing}`}
        >
          <WolfLogo size={28} />
          <span className="font-bold text-gray-700 dark:text-kova-silver tracking-wide text-sm">
            KOVA
          </span>
        </Link>

        {/* Nav links + CTA */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/docs"
            className={`hidden sm:inline-flex px-3 py-1.5 text-sm text-gray-500 dark:text-kova-silver-dim hover:text-gray-700 dark:hover:text-kova-silver transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-kova-charcoal-light ${focusRing}`}
          >
            {t("docs")}
          </Link>
          <Link
            href="/pricing"
            className={`hidden sm:inline-flex px-3 py-1.5 text-sm text-gray-500 dark:text-kova-silver-dim hover:text-gray-700 dark:hover:text-kova-silver transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-kova-charcoal-light ${focusRing}`}
          >
            {t("pricing")}
          </Link>
          <a
            href="https://github.com/lioneltchami/kova-cli"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 dark:text-kova-silver-dim hover:text-gray-700 dark:hover:text-kova-silver transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-kova-charcoal-light ${focusRing}`}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            {t("github")}
          </a>
          <a
            href="https://www.npmjs.com/package/kova-cli"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 dark:text-kova-silver-dim hover:text-gray-700 dark:hover:text-kova-silver transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-kova-charcoal-light ${focusRing}`}
          >
            <svg
              className="w-4 h-4 text-red-400"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
            </svg>
            {t("npm")}
          </a>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <div className="ml-1 hidden sm:block">
            <BgAnimateButton href="#quickstart" variant="secondary">
              {tCommon("getStarted")}
            </BgAnimateButton>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`sm:hidden p-2 text-gray-700 dark:text-kova-silver rounded-md ${focusRing}`}
            aria-label={t("toggleMenu")}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu - animated */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="sm:hidden overflow-hidden bg-white/95 dark:bg-kova-charcoal/95 backdrop-blur-md border-b border-gray-200 dark:border-kova-border"
          >
            <div className="px-4 py-4 space-y-3">
              {[
                { href: "/docs", label: t("docs") },
                { href: "/pricing", label: t("pricing") },
                { href: "https://github.com/lioneltchami/kova-cli", label: t("github"), external: true },
                { href: "https://www.npmjs.com/package/kova-cli", label: t("npm"), external: true },
              ].map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className={`block text-sm text-gray-500 dark:text-kova-silver-dim hover:text-gray-700 dark:hover:text-kova-silver py-2 rounded-md ${focusRing}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="#quickstart"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.2 }}
                className={`block text-sm font-semibold text-kova-blue py-2 rounded-md ${focusRing}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {tCommon("getStarted")}
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
