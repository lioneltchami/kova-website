import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = "https://kova.dev";
	return [
		{ url: baseUrl, lastModified: new Date(), priority: 1.0 },
		{ url: `${baseUrl}/docs`, lastModified: new Date(), priority: 0.9 },
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
			url: `${baseUrl}/docs/commands/init`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/plan`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/build`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/run`,
			lastModified: new Date(),
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/commands/pr`,
			lastModified: new Date(),
			priority: 0.7,
		},
	];
}
