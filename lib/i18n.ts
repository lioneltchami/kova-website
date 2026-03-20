import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
	const locale = (await requestLocale) || "en";
	const supportedLocales = ["en", "fr"];
	const resolvedLocale = supportedLocales.includes(locale) ? locale : "en";

	return {
		locale: resolvedLocale,
		messages: (await import(`../messages/${resolvedLocale}.json`)).default,
	};
});
