import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Kova",
    default: "Kova - AI Coding Orchestration CLI",
  },
  description:
    "Plan the hunt. Run the pack. Orchestrate 17+ specialist AI agents to plan, build, and ship code. Free, open source CLI with dependency-aware execution and independent quality validation.",
  openGraph: {
    title: "Kova - AI Coding Orchestration CLI",
    description:
      "Plan the hunt. Run the pack. Orchestrate 17+ specialist AI agents to plan, build, and ship code.",
    type: "website",
    images: ["/api/og"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kova - AI Coding Orchestration CLI",
    description:
      "Plan the hunt. Run the pack. Orchestrate 17+ specialist AI agents to plan, build, and ship code.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        style={{ backgroundColor: "#1A1A2E", color: "#C0C0C8" }}
      >
        {children}
      </body>
    </html>
  );
}
