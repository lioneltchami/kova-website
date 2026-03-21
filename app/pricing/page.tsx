"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { GradientHeading } from "@/components/ui/gradient-heading";

type BillingCycle = "monthly" | "annual";

interface PricingTier {
  name: string;
  slug: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  annualTotal: number | null;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  hasSeatSelector?: boolean;
}

function PriceDisplay({
  tier,
  billing,
  seats,
}: {
  tier: PricingTier;
  billing: BillingCycle;
  seats: number;
}) {
  const t = useTranslations("common");
  const perSeatPrice =
    billing === "annual" ? tier.annualPrice : tier.monthlyPrice;

  if (perSeatPrice === null) {
    return (
      <div className="mt-6 mb-2">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">
          {t("custom")}
        </span>
      </div>
    );
  }

  if (perSeatPrice === 0) {
    return (
      <div className="mt-6 mb-2">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">
          $0
        </span>
        <span className="ml-1 text-sm text-gray-500 dark:text-kova-silver-dim">
          {t("perMonth")}
        </span>
      </div>
    );
  }

  const totalMonthly = perSeatPrice * seats;
  const showSavings =
    billing === "annual" &&
    tier.annualPrice !== null &&
    tier.monthlyPrice !== null &&
    tier.annualPrice < tier.monthlyPrice;

  return (
    <div className="mt-6 mb-2">
      <div className="flex items-end gap-2 flex-wrap">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">
          ${totalMonthly}
        </span>
        <span className="mb-1 text-sm text-gray-500 dark:text-kova-silver-dim">
          {t("perMonth")}
        </span>
        {showSavings && (
          <span className="mb-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
            {t("save20")}
          </span>
        )}
      </div>
      {seats > 1 && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-kova-silver-dim">
          ${perSeatPrice}/seat &times; {seats} {t("seats").toLowerCase()}
        </p>
      )}
      {billing === "annual" && tier.annualTotal !== null && seats > 0 && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-kova-silver-dim">
          {t("billedAnnually", {
            total: `$${(tier.annualTotal * seats).toLocaleString()}`,
          })}
        </p>
      )}
    </div>
  );
}

function SeatSelector({
  seats,
  onChange,
}: {
  seats: number;
  onChange: (n: number) => void;
}) {
  const t = useTranslations("common");

  return (
    <div className="flex items-center gap-2 mt-3 mb-1">
      <label className="text-xs text-gray-500 dark:text-kova-silver-dim">
        {t("seats")}
      </label>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, seats - 1))}
          className="w-6 h-6 rounded border border-gray-200 dark:border-kova-border bg-gray-100 dark:bg-kova-charcoal-light text-gray-700 dark:text-kova-silver text-sm font-bold hover:border-kova-blue transition-colors"
        >
          -
        </button>
        <input
          type="number"
          min={1}
          max={500}
          value={seats}
          onChange={(e) =>
            onChange(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))
          }
          className="w-12 text-center bg-gray-100 dark:bg-kova-charcoal-light border border-gray-200 dark:border-kova-border rounded px-1 py-0.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-kova-blue"
        />
        <button
          onClick={() => onChange(Math.min(500, seats + 1))}
          className="w-6 h-6 rounded border border-gray-200 dark:border-kova-border bg-gray-100 dark:bg-kova-charcoal-light text-gray-700 dark:text-kova-silver text-sm font-bold hover:border-kova-blue transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

function PricingCard({
  tier,
  billing,
  seats,
  onSeatsChange,
}: {
  tier: PricingTier;
  billing: BillingCycle;
  seats: number;
  onSeatsChange: (n: number) => void;
}) {
  const t = useTranslations("common");
  const isFree = tier.monthlyPrice === 0;

  const checkoutHref = isFree
    ? "/docs/getting-started/installation"
    : `/api/polar/checkout?product=${tier.slug}_${billing}&seats=${seats}`;

  const ctaLabel = isFree ? t("getStartedFree") : t("subscribe");
  const isPrimary = !isFree;

  const ctaClassName = isPrimary
    ? "mt-5 block w-full rounded-lg bg-kova-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-kova-blue-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-kova-charcoal"
    : "mt-5 block w-full rounded-lg border border-gray-200 dark:border-kova-border px-4 py-2.5 text-center text-sm font-semibold text-gray-700 dark:text-kova-silver transition-colors hover:border-gray-400 dark:hover:border-kova-silver hover:text-gray-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-kova-charcoal";

  return (
    <div
      className={[
        "relative flex flex-col rounded-xl border bg-gray-50 dark:bg-kova-surface p-6",
        tier.highlighted
          ? "border-kova-blue shadow-[0_0_30px_-4px_rgba(67,97,238,0.35)]"
          : "border-gray-200 dark:border-kova-border",
      ].join(" ")}
    >
      {tier.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-kova-blue px-3 py-0.5 text-xs font-semibold text-white">
          {tier.badge}
        </span>
      )}

      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {tier.name}
        </h3>
        <PriceDisplay tier={tier} billing={billing} seats={seats} />
        {tier.hasSeatSelector && (
          <SeatSelector seats={seats} onChange={onSeatsChange} />
        )}
        <p className="text-sm text-gray-500 dark:text-kova-silver-dim mt-2">
          {tier.description}
        </p>
      </div>

      <Link href={checkoutHref} className={ctaClassName}>
        {ctaLabel}
      </Link>

      {tier.slug === "enterprise" && (
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-kova-silver-dim">
          {t("contactEnterprise")}{" "}
          <a
            href="mailto:enterprise@kova.dev"
            className="text-kova-blue hover:underline"
          >
            enterprise@kova.dev
          </a>
        </p>
      )}

      <ul className="mt-6 space-y-3 border-t border-gray-200 dark:border-kova-border pt-6">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check
              size={15}
              className="mt-0.5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
            <span className="text-sm text-gray-700 dark:text-kova-silver">
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PricingPage() {
  const t = useTranslations("pricing");
  const tCommon = useTranslations("common");
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [proSeats, setProSeats] = useState(1);
  const [enterpriseSeats, setEnterpriseSeats] = useState(1);

  const tiers: PricingTier[] = [
    {
      name: "Free",
      slug: "free",
      monthlyPrice: 0,
      annualPrice: 0,
      annualTotal: 0,
      description: t("tierFreeDescription"),
      features: [
        "1 developer seat",
        "Claude Code usage tracking",
        "30-day local history",
        "Daily cost summaries",
        "CLI budget alerts",
      ],
    },
    {
      name: "Pro",
      slug: "pro",
      monthlyPrice: 15,
      annualPrice: 12,
      annualTotal: 144,
      description: t("tierProDescription"),
      features: [
        "Everything in Free",
        "All 5 tools: Cursor, Copilot, Windsurf, Devin + Claude Code",
        "1-year cloud history",
        "Team dashboard with per-member costs",
        "Budget alerts (daily + monthly)",
        "CSV / JSON export",
        "Email support",
      ],
      highlighted: true,
      badge: t("badgeMostPopular"),
      hasSeatSelector: true,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      monthlyPrice: 30,
      annualPrice: 24,
      annualTotal: 288,
      description: t("tierEnterpriseDescription"),
      features: [
        "Everything in Pro",
        "SSO / SAML integration",
        "Audit log exports",
        "REST API access",
        "Priority support + SLA",
        "Custom data retention",
        "Dedicated onboarding",
      ],
      hasSeatSelector: true,
    },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
  ];

  function getSeats(tier: PricingTier) {
    if (tier.slug === "pro") return proSeats;
    if (tier.slug === "enterprise") return enterpriseSeats;
    return 1;
  }

  function handleSeatsChange(tier: PricingTier, n: number) {
    if (tier.slug === "pro") setProSeats(n);
    else if (tier.slug === "enterprise") setEnterpriseSeats(n);
  }

  return (
    <main className="min-h-screen bg-white dark:bg-kova-charcoal">
      <Navbar />

      <section className="px-4 pb-24 pt-32">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <GradientHeading
              as="h1"
              className="text-3xl font-bold sm:text-4xl lg:text-5xl"
              gradient={{ from: "#4361EE", to: "#C0C0C8" }}
            >
              {t("heading")}
            </GradientHeading>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-500 dark:text-kova-silver-dim">
              {t("subheading")}
            </p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-kova-border bg-gray-50 dark:bg-kova-surface p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={[
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-kova-charcoal",
                  billing === "monthly"
                    ? "bg-kova-blue text-white"
                    : "text-gray-500 dark:text-kova-silver-dim hover:text-gray-700 dark:hover:text-kova-silver",
                ].join(" ")}
              >
                {tCommon("monthly")}
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={[
                  "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-kova-charcoal",
                  billing === "annual"
                    ? "bg-kova-blue text-white"
                    : "text-gray-500 dark:text-kova-silver-dim hover:text-gray-700 dark:hover:text-kova-silver",
                ].join(" ")}
              >
                {tCommon("annual")}
                <span
                  className={[
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
                    billing === "annual"
                      ? "bg-white/20 text-white"
                      : "bg-emerald-500/15 text-emerald-400",
                  ].join(" ")}
                >
                  {tCommon("save20")}
                </span>
              </button>
            </div>
          </div>

          {/* Social proof banner */}
          <div className="text-center mb-12">
            <p className="text-gray-500 dark:text-kova-silver-dim text-sm">
              {t("trustedBy")}
            </p>
            <div className="flex justify-center gap-8 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-kova-silver">
                  {t("stat1Value")}
                </p>
                <p className="text-xs text-gray-500 dark:text-kova-silver-dim">
                  {t("stat1Label")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-kova-silver">
                  {t("stat2Value")}
                </p>
                <p className="text-xs text-gray-500 dark:text-kova-silver-dim">
                  {t("stat2Label")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-kova-silver">
                  {t("stat3Value")}
                </p>
                <p className="text-xs text-gray-500 dark:text-kova-silver-dim">
                  {t("stat3Label")}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing grid -- 3 tiers */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {tiers.map((tier) => (
              <PricingCard
                key={tier.name}
                tier={tier}
                billing={billing}
                seats={getSeats(tier)}
                onSeatsChange={(n) => handleSeatsChange(tier, n)}
              />
            ))}
          </div>

          {/* Bottom note */}
          <p className="mt-10 text-center text-xs text-gray-500 dark:text-kova-silver-dim">
            {t("allPricesNote")}
          </p>

          {/* Start Free CTA */}
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-kova-silver-dim text-sm mb-3">
              {tCommon("notSureYet")}
            </p>
            <a
              href="/docs/getting-started/installation"
              className="text-kova-blue hover:text-kova-blue-light text-lg font-semibold transition-colors"
            >
              {tCommon("startFreeUpgrade")} &rarr;
            </a>
          </div>

          {/* FAQ */}
          <div className="mt-4 max-w-2xl mx-auto pb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">
              {t("faqHeading")}
            </h2>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-gray-200 dark:border-kova-border bg-gray-50 dark:bg-kova-surface overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer text-sm font-medium text-gray-700 dark:text-kova-silver hover:text-gray-900 dark:hover:text-white transition-colors list-none select-none">
                    <span>{faq.q}</span>
                    <span className="shrink-0 text-gray-500 dark:text-kova-silver-dim text-lg leading-none group-open:rotate-45 transition-transform duration-200">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-500 dark:text-kova-silver-dim leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
