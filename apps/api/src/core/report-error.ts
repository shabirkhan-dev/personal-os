import { sendErrorReport } from "@personal-os/domain/error-report";

import type { Config } from "@/config/env";

/**
 * Sends an unexpected failure to the crash reporter when SENTRY_DSN is set, after the response
 * (through `waitUntil`), so reporting never slows or breaks a request. Only technical context is
 * attached: the route, the method and the request id.
 */
export function reportError(
	config: Config | undefined,
	error: unknown,
	where: { tags: Record<string, string>; extra?: Record<string, string> },
	waitUntil?: (promise: Promise<unknown>) => void,
): void {
	if (!config?.errors.dsn) return;
	const sending = sendErrorReport(config.errors.dsn, error, {
		environment: config.environment,
		release: config.errors.release,
		tags: { service: "api", ...where.tags },
		extra: where.extra ?? {},
	});
	if (waitUntil) waitUntil(sending);
	else void sending;
}
