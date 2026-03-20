import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = "https://kova.dev";
	return [
		{ url: baseUrl, lastModified: new Date(), priority: 1.0 },
		{ url: `${baseUrl}/pricing`, lastModified: new Date(), priority: 0.9 },
		{ url: `${baseUrl}/changelog`, lastModified: new Date(), priority: 0.7 },
		{ url: `${baseUrl}/status`, lastModified: new Date(), priority: 0.5 },
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
		// Commands
		{
			url: `${baseUrl}/docs/commands/init`,
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
			url: `${baseUrl}/docs/commands/compare`,
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
			url: `${baseUrl}/docs/commands/audit`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/ci-report`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/tag`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/data-export`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/dashboard`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/sso`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/policy`,
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
		// Guides
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
		{
			url: `${baseUrl}/docs/guides/enterprise-rbac`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/guides/ci-cd-integration`,
			lastModified: new Date(),
			priority: 0.7,
		},
		// Reference
		{
			url: `${baseUrl}/docs/reference/agent-types`,
			lastModified: new Date(),
			priority: 0.6,
		},
		{
			url: `${baseUrl}/docs/reference/checkpoint-format`,
			lastModified: new Date(),
			priority: 0.6,
		},
		{
			url: `${baseUrl}/docs/reference/kova-yaml`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/reference/plan-format`,
			lastModified: new Date(),
			priority: 0.6,
		},
		// API docs
		{
			url: `${baseUrl}/docs/api/overview`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/api/usage`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/api/rate-limits`,
			lastModified: new Date(),
			priority: 0.6,
		},
	];
}
