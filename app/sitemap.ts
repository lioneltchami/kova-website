import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = "https://kova.dev";
	return [
		{ url: baseUrl, lastModified: new Date(), priority: 1.0 },
		{ url: `${baseUrl}/pricing`, lastModified: new Date(), priority: 0.9 },
		{ url: `${baseUrl}/docs`, lastModified: new Date(), priority: 0.8 },
		{
			url: `${baseUrl}/docs/getting-started/installation`,
			lastModified: new Date(),
			priority: 0.8,
		},
		{
			url: `${baseUrl}/docs/getting-started/quickstart`,
			lastModified: new Date(),
			priority: 0.8,
		},
		{
			url: `${baseUrl}/docs/getting-started/configuration`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/track`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/costs`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/sync`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/budget`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/config`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/report`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/login`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/logout`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/account`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/completions`,
			lastModified: new Date(),
			priority: 0.6,
		},
		{
			url: `${baseUrl}/docs/guides/multi-tool-tracking`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/guides/team-dashboard-setup`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/guides/token-tracking`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/guides/auto-sync`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/guides/budget-alerts`,
			lastModified: new Date(),
			priority: 0.7,
		},
	];
}
