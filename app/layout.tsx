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
				className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-kova-charcoal text-kova-silver`}
			>
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-kova-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
				>
					Skip to content
				</a>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "SoftwareApplication",
							name: "Kova",
							description:
								"AI coding orchestration CLI - Plan the hunt. Run the pack.",
							applicationCategory: "DeveloperApplication",
							operatingSystem: "Windows, macOS, Linux",
							offers: {
								"@type": "Offer",
								price: "0",
								priceCurrency: "USD",
							},
							author: {
								"@type": "Person",
								name: "Lionel Tchami",
							},
						}),
					}}
				/>
				{children}
			</body>
		</html>
	);
}
