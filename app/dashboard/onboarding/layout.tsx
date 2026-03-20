import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up Kova CLI",
  description: "Connect your AI tools to start tracking costs with Kova.",
  robots: { index: false },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
