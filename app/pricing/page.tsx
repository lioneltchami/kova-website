"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { GradientHeading } from "@/components/ui/gradient-heading";

type BillingCycle = "monthly" | "annual";

interface PricingTier {
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  description: string;
  features: string[];
  cta: {
    label: string;
    href: string;
    variant: "primary" | "outline";
  };
  badge?: string;
  highlighted?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Everything you need to build with Kova, forever free.",
    features: [
      "All 11 CLI commands",
      "6 plan templates",
      "GitHub integration (PR, issues, branches)",
      "Shell completions",
      "Interactive mode",
      "Local build history",
    ],
    cta: {
      label: "Get Started",
      href: "/docs/getting-started/installation",
      variant: "outline",
    },
  },
  {
    name: "Pro",
    monthlyPrice: 29,
    annualPrice: 23,
    description:
      "For developers who ship daily and need cloud-powered insights.",
    features: [
      "Everything in Free",
      "Cloud build history & analytics",
      "Token usage optimization",
      "Cost tracking dashboard",
      "Unlimited webhooks",
      "Email support",
    ],
    cta: {
      label: "Subscribe",
      href: "#",
      variant: "primary",
    },
    badge: "Most Popular",
    highlighted: true,
  },
  {
    name: "Team",
    monthlyPrice: 99,
    annualPrice: 79,
    description: "For engineering teams that need shared plans and governance.",
    features: [
      "Everything in Pro",
      "Shared team plans",
      "Approval workflows",
      "Centralized config",
      "5 team seats",
    ],
    cta: {
      label: "Subscribe",
      href: "#",
      variant: "primary",
    },
  },
  {
    name: "Enterprise",
    monthlyPrice: 299,
    annualPrice: null,
    description: "For organizations that need compliance, control, and scale.",
    features: [
      "Everything in Team",
      "SSO / SAML",
      "Audit logs",
      "Custom agent definitions",
      "Unlimited seats",
      "Dedicated support",
    ],
    cta: {
      label: "Contact Us",
      href: "mailto:hello@kova.dev",
      variant: "primary",
    },
  },
];

function PriceDisplay({
  tier,
  billing,
}: {
  tier: PricingTier;
  billing: BillingCycle;
}) {
  const price =
    billing === "annual" && tier.annualPrice !== null
      ? tier.annualPrice
      : tier.monthlyPrice;

  if (price === null) {
    return (
      <div className="mt-6 mb-2">
        <span className="text-4xl font-bold text-white">Custom</span>
      </div>
    );
  }

  if (price === 0) {
    return (
      <div className="mt-6 mb-2">
        <span className="text-4xl font-bold text-white">$0</span>
        <span className="ml-1 text-sm text-kova-silver-dim">/ month</span>
      </div>
    );
  }

  const showSavings =
    billing === "annual" &&
    tier.annualPrice !== null &&
    tier.monthlyPrice !== null &&
    tier.annualPrice < tier.monthlyPrice;

  return (
    <div className="mt-6 mb-2">
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold text-white">${price}</span>
        <span className="mb-1 text-sm text-kova-silver-dim">/ month</span>
        {showSavings && (
          <span className="mb-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
            Save 20%
          </span>
        )}
      </div>
      {billing === "annual" && (
        <p className="mt-1 text-xs text-kova-silver-dim">
          Billed ${(price * 12).toLocaleString()} annually
        </p>
      )}
    </div>
  );
}

function PricingCard({
  tier,
  billing,
}: {
  tier: PricingTier;
  billing: BillingCycle;
}) {
  const isExternalOrMailto =
    tier.cta.href.startsWith("mailto:") || tier.cta.href.startsWith("http");

  const ctaClassName =
    tier.cta.variant === "primary"
      ? "mt-6 block w-full rounded-lg bg-kova-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-kova-blue-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-kova-charcoal"
      : "mt-6 block w-full rounded-lg border border-kova-border px-4 py-2.5 text-center text-sm font-semibold text-kova-silver transition-colors hover:border-kova-silver hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-kova-charcoal";

  return (
    <div
      className={[
        "relative flex flex-col rounded-xl border bg-kova-surface p-6",
        tier.highlighted
          ? "border-kova-blue shadow-[0_0_30px_-4px_rgba(67,97,238,0.35)]"
          : "border-kova-border",
      ].join(" ")}
    >
      {tier.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-kova-blue px-3 py-0.5 text-xs font-semibold text-white">
          {tier.badge}
        </span>
      )}

      <div>
        <h3 className="text-base font-semibold text-white">{tier.name}</h3>
        <PriceDisplay tier={tier} billing={billing} />
        <p className="text-sm text-kova-silver-dim">{tier.description}</p>
      </div>

      {isExternalOrMailto ? (
        <a href={tier.cta.href} className={ctaClassName}>
          {tier.cta.label}
        </a>
      ) : (
        <Link href={tier.cta.href} className={ctaClassName}>
          {tier.cta.label}
        </Link>
      )}

      <ul className="mt-6 space-y-3 border-t border-kova-border pt-6">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check
              size={15}
              className="mt-0.5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
            <span className="text-sm text-kova-silver">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <main className="min-h-screen bg-kova-charcoal">
      <Navbar />

      <section className="px-4 pb-24 pt-32">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <GradientHeading
              as="h1"
              className="text-3xl font-bold sm:text-4xl lg:text-5xl"
              gradient={{ from: "#4361EE", to: "#C0C0C8" }}
            >
              Simple, Transparent Pricing
            </GradientHeading>
            <p className="mx-auto mt-4 max-w-xl text-base text-kova-silver-dim">
              Free forever for individuals. Pro for teams that ship.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-1 rounded-lg border border-kova-border bg-kova-surface p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={[
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-kova-charcoal",
                  billing === "monthly"
                    ? "bg-kova-blue text-white"
                    : "text-kova-silver-dim hover:text-kova-silver",
                ].join(" ")}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={[
                  "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-kova-charcoal",
                  billing === "annual"
                    ? "bg-kova-blue text-white"
                    : "text-kova-silver-dim hover:text-kova-silver",
                ].join(" ")}
              >
                Annual
                <span
                  className={[
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
                    billing === "annual"
                      ? "bg-white/20 text-white"
                      : "bg-emerald-500/15 text-emerald-400",
                  ].join(" ")}
                >
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {tiers.map((tier) => (
              <PricingCard key={tier.name} tier={tier} billing={billing} />
            ))}
          </div>

          {/* Bottom note */}
          <p className="mt-10 text-center text-xs text-kova-silver-dim">
            All prices in USD. Annual plans billed yearly. Cancel anytime.
            Enterprise pricing is fixed monthly.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
