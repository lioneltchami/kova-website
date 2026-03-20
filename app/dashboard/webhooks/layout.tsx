import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webhooks",
  description:
    "Manage webhook endpoints to receive real-time notifications for workspace events.",
  robots: { index: false },
};

export default function WebhooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
