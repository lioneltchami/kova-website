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

const tiers: PricingTier[] = [
  {
    name: "Free",
    slug: "free",
    monthlyPrice: 0,
    annualPrice: 0,
    annualTotal: 0,
    description: "One developer, Claude Code tracking, 30-day local history.",
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
    description:
      "All 5 AI tools tracked, 1-year cloud history, team dashboard, and budget alerts.",
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
    badge: "Most Popular",
    hasSeatSelector: true,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    monthlyPrice: 30,
    annualPrice: 24,
    annualTotal: 288,
    description:
      "Pro plus SSO, audit log exports, API access, and priority support.",
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

function PriceDisplay({
  tier,
  billing,
  seats,
}: {
  tier: PricingTier;
  billing: BillingCycle;
  seats: number;
}) {
  const perSeatPrice =
    billing === "annual" ? tier.annualPrice : tier.monthlyPrice;

  if (perSeatPrice === null) {
    return (
      <div className="mt-6 mb-2">
        <span className="text-4xl font-bold text-white">Custom</span>
      </div>
    );
  }

  if (perSeatPrice === 0) {
    return (
      <div className="mt-6 mb-2">
        <span className="text-4xl font-bold text-white">$0</span>
        <span className="ml-1 text-sm text-kova-silver-dim">/ month</span>
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
        <span className="text-4xl font-bold text-white">${totalMonthly}</span>
        <span className="mb-1 text-sm text-kova-silver-dim">/ month</span>
        {showSavings && (
          <span className="mb-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
            Save 20%
          </span>
        )}
      </div>
      {seats > 1 && (
        <p className="mt-0.5 text-xs text-kova-silver-dim">
          ${perSeatPrice}/seat &times; {seats} seats
        </p>
      )}
      {billing === "annual" && tier.annualTotal !== null && seats > 0 && (
        <p className="mt-0.5 text-xs text-kova-silver-dim">
          Billed ${(tier.annualTotal * seats).toLocaleString()} annually
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
  return (
    <div className="flex items-center gap-2 mt-3 mb-1">
      <label className="text-xs text-kova-silver-dim">Seats</label>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, seats - 1))}
          className="w-6 h-6 rounded border border-kova-border bg-kova-charcoal-light text-kova-silver text-sm font-bold hover:border-kova-blue transition-colors"
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
          className="w-12 text-center bg-kova-charcoal-light border border-kova-border rounded px-1 py-0.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-kova-blue"
        />
        <button
          onClick={() => onChange(Math.min(500, seats + 1))}
          className="w-6 h-6 rounded border border-kova-border bg-kova-charcoal-light text-kova-silver text-sm font-bold hover:border-kova-blue transition-colors"
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
  const isFree = tier.monthlyPrice === 0;

  const checkoutHref = isFree
    ? "/docs/getting-started/installation"
    : `/api/polar/checkout?product=${tier.slug}_${billing}&seats=${seats}`;

  const ctaLabel = isFree ? "Get Started Free" : "Subscribe";
  const isPrimary = !isFree;

  const ctaClassName = isPrimary
    ? "mt-5 block w-full rounded-lg bg-kova-blue px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-kova-blue-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-kova-charcoal"
    : "mt-5 block w-full rounded-lg border border-kova-border px-4 py-2.5 text-center text-sm font-semibold text-kova-silver transition-colors hover:border-kova-silver hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kova-blue focus-visible:ring-offset-2 focus-visible:ring-offset-kova-charcoal";

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
        <PriceDisplay tier={tier} billing={billing} seats={seats} />
        {tier.hasSeatSelector && (
          <SeatSelector seats={seats} onChange={onSeatsChange} />
        )}
        <p className="text-sm text-kova-silver-dim mt-2">{tier.description}</p>
      </div>

      <Link href={checkoutHref} className={ctaClassName}>
        {ctaLabel}
      </Link>

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
  const [proSeats, setProSeats] = useState(1);
  const [enterpriseSeats, setEnterpriseSeats] = useState(1);

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
    <main className="min-h-screen bg-kova-charcoal">
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
              Simple, Transparent Pricing
            </GradientHeading>
            <p className="mx-auto mt-4 max-w-xl text-base text-kova-silver-dim">
              Free forever for solo developers. Pro for teams that want full
              visibility into AI tool spend.
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
                  Save 20%
                </span>
              </button>
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
          <p className="mt-10 text-center text-xs text-kova-silver-dim">
            All prices in USD per seat. Annual plans billed yearly. Cancel
            anytime. Enterprise pricing scales linearly with seat count.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
