/**
 * Cloudflare Pages Function: POST /api/notify stores a launch-day email in Workers KV.
 * Bind a KV namespace as `WAITLIST` in the Pages project (Settings → Bindings).
 * Keys are `email:<address>`; the value records when it was added. Re-submitting is a no-op.
 */

type KvNamespace = {
	get(key: string): Promise<string | null>;
	put(key: string, value: string): Promise<void>;
};

type Env = { WAITLIST?: KvNamespace };

type PagesContext = { request: Request; env: Env };

const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const MAX_EMAIL_LENGTH = 320;
const MAX_BODY_BYTES = 1024;

function json(status: number, body: Record<string, unknown>): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", "cache-control": "no-store" },
	});
}

function readEmail(text: string): string | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch (error) {
		console.warn("notify: body is not JSON", error);
		return null;
	}
	if (typeof parsed !== "object" || parsed === null || !("email" in parsed)) return null;
	const { email } = parsed;
	if (typeof email !== "string") return null;
	const normalized = email.trim().toLowerCase();
	return normalized.length <= MAX_EMAIL_LENGTH && EMAIL.test(normalized) ? normalized : null;
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
	if (!env.WAITLIST) {
		console.error("notify: the WAITLIST KV binding is missing");
		return json(503, { ok: false, error: "unavailable" });
	}
	const text = await request.text();
	if (text.length > MAX_BODY_BYTES) return json(413, { ok: false, error: "too_large" });
	const email = readEmail(text);
	if (!email) return json(400, { ok: false, error: "invalid_email" });

	const key = `email:${email}`;
	if ((await env.WAITLIST.get(key)) === null) {
		await env.WAITLIST.put(key, JSON.stringify({ createdAt: new Date().toISOString() }));
	}
	return json(200, { ok: true });
}
