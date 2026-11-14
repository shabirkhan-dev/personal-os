/**
 * A tiny crash reporter in Sentry's envelope format, shared by the API and the app. It needs no
 * SDK: it posts one event per error to the project's DSN with `fetch`, so it runs on Workers,
 * React Native and in tests alike. Nothing is sent without a DSN, and events carry the error
 * and where it happened, never a person's records.
 */

export type Dsn = { endpoint: string; publicKey: string; raw: string };

/** Reads `https://<key>@<host>/<project>`; null for anything else (reporting stays off). */
export function parseDsn(value: string | undefined | null): Dsn | null {
	if (!value) return null;
	try {
		const url = new URL(value);
		const project = url.pathname.replace(/^\/+/, "");
		if (url.protocol !== "https:" || !url.username || !/^\d+$/.test(project)) return null;
		return {
			endpoint: `https://${url.host}/api/${project}/envelope/`,
			publicKey: url.username,
			raw: value,
		};
	} catch {
		return null;
	}
}

export type ErrorContext = {
	environment: string;
	release?: string | null;
	/** Small labels for grouping and search: the route, the platform, the module. */
	tags?: Record<string, string>;
	/** Technical details only (a request id, the HTTP method), never user content. */
	extra?: Record<string, string | number | boolean | null>;
	level?: "error" | "warning" | "fatal";
};

type Frame = { function?: string; filename?: string; lineno?: number; colno?: number };

/** V8, JavaScriptCore and Hermes stack lines into Sentry frames, oldest first. */
export function stackFrames(stack: string | undefined): Frame[] {
	if (!stack) return [];
	const frames: Frame[] = [];
	for (const line of stack.split("\n").slice(0, 50)) {
		const v8 = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/.exec(line);
		const jsc = /^(.*?)@(.+?):(\d+):(\d+)$/.exec(line.trim());
		const match = v8 ?? jsc;
		if (!match) continue;
		frames.push({
			function: match[1] || "?",
			filename: match[2],
			lineno: Number(match[3]),
			colno: Number(match[4]),
		});
	}
	return frames.toReversed();
}

const randomHex = (bytes: number) => {
	const values = new Uint8Array(bytes);
	crypto.getRandomValues(values);
	return [...values].map((value) => value.toString(16).padStart(2, "0")).join("");
};

/** The envelope body for one error. */
export function buildEnvelope(
	dsn: Dsn,
	error: unknown,
	context: ErrorContext,
	now = new Date(),
): string {
	const failure = error instanceof Error ? error : new Error(String(error));
	const eventId = randomHex(16);
	const event = {
		event_id: eventId,
		timestamp: now.getTime() / 1000,
		platform: "javascript",
		level: context.level ?? "error",
		environment: context.environment,
		...(context.release ? { release: context.release } : {}),
		tags: context.tags ?? {},
		extra: context.extra ?? {},
		exception: {
			values: [
				{
					type: failure.name || "Error",
					value: failure.message.slice(0, 1000),
					stacktrace: { frames: stackFrames(failure.stack) },
				},
			],
		},
	};
	return [
		JSON.stringify({ event_id: eventId, sent_at: now.toISOString(), dsn: dsn.raw }),
		JSON.stringify({ type: "event" }),
		JSON.stringify(event),
	].join("\n");
}

/** Sends one error. Never throws: a reporter must not become a second failure. */
export async function sendErrorReport(
	dsn: Dsn | null,
	error: unknown,
	context: ErrorContext,
	send: typeof fetch = fetch,
): Promise<boolean> {
	if (!dsn) return false;
	try {
		const response = await send(dsn.endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-sentry-envelope",
				"X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=personal-os/1.0`,
			},
			body: buildEnvelope(dsn, error, context),
		});
		return response.ok;
	} catch (reportError) {
		console.warn("[errors] could not send the error report", reportError);
		return false;
	}
}
