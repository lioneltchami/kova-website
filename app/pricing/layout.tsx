import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for AI dev cost tracking. Free for solo developers, Pro from $15/seat.",
  openGraph: {
    title: "Kova Pricing",
    description: "From free to enterprise. Track AI tool costs at any scale.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
