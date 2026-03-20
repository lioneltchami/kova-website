// Next.js instrumentation hook -- loaded once per server worker process.
// Initialises Sentry for the appropriate runtime environment.
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("./sentry.server.config");
	}

	if (process.env.NEXT_RUNTIME === "edge") {
		await import("./sentry.edge.config");
	}
}
