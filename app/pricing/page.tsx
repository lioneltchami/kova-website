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

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel your subscription at any time from the dashboard. You'll keep access until the end of your billing period.",
  },
  {
    q: "What counts as a seat?",
    a: "Each developer who runs kova track and syncs data to the dashboard counts as one seat. API keys are per-developer.",
  },
  {
    q: "How does the free plan differ from Pro?",
    a: "Free gives you 1 tool (Claude Code), 30-day local history, and basic cost tracking. Pro unlocks all 5 AI tools, 1-year cloud history, team dashboard, budget alerts, and cost forecasting.",
  },
  {
    q: "Do you support annual billing?",
    a: "Yes. Annual billing saves you 20% compared to monthly. Toggle the billing switch on any plan to see annual pricing.",
  },
  {
    q: "What AI tools are supported?",
    a: "Kova tracks Claude Code, Cursor, GitHub Copilot, Windsurf, and Devin. More tools are added regularly.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted in transit and at rest. We use Supabase with Row Level Security, rate limiting, and HTTPS enforcement. Your usage data is never shared with third parties.",
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

      {tier.slug === "enterprise" && (
        <p className="mt-2 text-center text-xs text-kova-silver-dim">
          Contact us for custom enterprise agreements at{" "}
          <a
            href="mailto:enterprise@kova.dev"
            className="text-kova-blue hover:underline"
          >
            enterprise@kova.dev
          </a>
        </p>
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

          {/* Social proof banner */}
          <div className="text-center mb-12">
            <p className="text-kova-silver-dim text-sm">
              Trusted by developer teams tracking their AI costs
            </p>
            <div className="flex justify-center gap-8 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-kova-silver">5</p>
                <p className="text-xs text-kova-silver-dim">AI Tools Tracked</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-kova-silver">$0</p>
                <p className="text-xs text-kova-silver-dim">To Get Started</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-kova-silver">100%</p>
                <p className="text-xs text-kova-silver-dim">Cost Visibility</p>
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
          <p className="mt-10 text-center text-xs text-kova-silver-dim">
            All prices in USD per seat. Annual plans billed yearly. Cancel
            anytime. Enterprise pricing scales linearly with seat count.
          </p>

          {/* Start Free CTA */}
          <div className="text-center py-8">
            <p className="text-kova-silver-dim text-sm mb-3">Not sure yet?</p>
            <a
              href="/docs/getting-started/installation"
              className="text-kova-blue hover:text-kova-blue-light text-lg font-semibold transition-colors"
            >
              Start free, upgrade when ready &rarr;
            </a>
          </div>

          {/* FAQ */}
          <div className="mt-4 max-w-2xl mx-auto pb-8">
            <h2 className="text-xl font-bold text-white text-center mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-kova-border bg-kova-surface overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer text-sm font-medium text-kova-silver hover:text-white transition-colors list-none select-none">
                    <span>{faq.q}</span>
                    <span className="shrink-0 text-kova-silver-dim text-lg leading-none group-open:rotate-45 transition-transform duration-200">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-4">
                    <p className="text-sm text-kova-silver-dim leading-relaxed">
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
