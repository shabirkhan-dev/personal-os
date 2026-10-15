/**
 * What Cloudflare hands the Worker: plain vars and secrets as strings, plus bindings. Strings are
 * parsed and checked once in `config/env.ts`; code reads the typed `Config`, never these.
 */
interface CloudflareBindings {
	// Vars (wrangler.jsonc) and secrets (wrangler secret put / .dev.vars).
	ENVIRONMENT?: string;
	APP_NAME?: string;
	AUTH_EMAIL_FROM?: string;
	JWT_SECRET?: string;
	AUTH_TOKEN_SECRET?: string;
	RESEND_API_KEY?: string;
	AI_PROVIDER?: string;
	OPENAI_API_KEY?: string;
	OPENAI_BASE_URL?: string;
	OPENAI_MODEL?: string;
	R2_ACCOUNT_ID?: string;
	R2_BUCKET_NAME?: string;
	R2_ACCESS_KEY_ID?: string;
	R2_SECRET_ACCESS_KEY?: string;
	R2_PUBLIC_URL?: string;
	/** Only outside Workers (tests, scripts); on Workers the database comes from HYPERDRIVE. */
	DATABASE_URL?: string;

	// Bindings.
	HYPERDRIVE?: Hyperdrive;
	ASSETS?: R2Bucket;
	AUTH_LIMITER?: RateLimit;
	AI_LIMITER?: RateLimit;
	SYNC_LIMITER?: RateLimit;
}
