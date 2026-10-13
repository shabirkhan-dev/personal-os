import { handleNotify, json, type KvNamespace } from "./notify";

/** Static assets binding (`out/`, see wrangler.jsonc). */
type Assets = { fetch(request: Request): Promise<Response> };

type Env = { ASSETS: Assets; WAITLIST?: KvNamespace };

/**
 * Cloudflare Worker for the landing page. `run_worker_first` sends only `/api/*` here; every
 * other request is served straight from the static export.
 */
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (pathname === "/api/notify") {
			if (request.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });
			return handleNotify(request, env.WAITLIST);
		}
		if (pathname.startsWith("/api/")) return json(404, { ok: false, error: "not_found" });
		return env.ASSETS.fetch(request);
	},
};
