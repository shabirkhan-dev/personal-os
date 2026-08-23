import * as z from 'zod';

const developmentJwtSecret = 'development-only-jwt-secret-change-me';
const developmentTokenSecret = 'development-only-auth-token-secret-change-me';

const booleanFromString = z
	.enum(['true', 'false'])
	.default('false')
	.transform((value) => value === 'true');

export const envSchema = z
	.object({
		NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
		PORT: z.coerce.number().int().positive().default(4000),
		API_PREFIX: z.string().min(1).default('api'),
		API_VERSION: z.string().regex(/^\d+$/).default('1'),
		SERVICE_NAME: z.string().min(1).default('personal-os-api'),
		APP_NAME: z.string().min(1).max(80).default('Personal OS'),
		WEB_APP_URL: z.url().default('http://localhost:3000'),
		DATABASE_URL: z
			.url()
			.default('postgresql://personal-os:personal-os@localhost:5433/personal-os'),
		DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
		DATABASE_SSL: z.enum(['true', 'false']).optional(),
		JWT_SECRET: z.string().min(32).default(developmentJwtSecret),
		JWT_ACCESS_EXPIRES_IN: z
			.string()
			.regex(/^\d+[smhd]$/)
			.default('15m'),
		AUTH_TOKEN_SECRET: z.string().min(32).default(developmentTokenSecret),
		SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
		OTP_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(10),
		OTP_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),
		MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
		MFA_CHALLENGE_TTL_MINUTES: z.coerce.number().int().min(2).max(15).default(5),
		STEP_UP_TTL_MINUTES: z.coerce.number().int().min(1).max(30).default(5),
		PASSWORD_BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
		MAX_LOGIN_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
		LOGIN_LOCK_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
		REFRESH_COOKIE_NAME: z.string().min(1).default('personal_os_refresh_token'),
		COOKIE_DOMAIN: z.string().min(1).optional(),
		/**
		 * Use `none` when the web app and API are on different sites
		 * (e.g. Vercel ↔ Render). Requires Secure cookies (production HTTPS).
		 */
		COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
		CORS_ORIGIN: z.string().min(1).default('http://localhost:3000,http://127.0.0.1:3000'),
		TRUST_PROXY: booleanFromString,
		AUTH_DEV_EXPOSE_CODES: z
			.enum(['true', 'false'])
			.default('true')
			.transform((value) => value === 'true'),
		RESEND_API_KEY: z.string().min(1).optional(),
		AUTH_EMAIL_FROM: z.string().min(3).default('Personal OS <auth@example.com>'),
		WEBAUTHN_RP_ID: z.string().min(1).default('localhost'),
		/** Comma-separated allowed WebAuthn origins (web + native). */
		WEBAUTHN_ORIGIN: z.string().min(1).default('http://localhost:3000'),
		GOOGLE_CLIENT_ID: z.string().min(1).optional(),
		BILLING_DEFAULT_PROVIDER: z.enum(['stripe', 'razorpay']).default('stripe'),
		STRIPE_SECRET_KEY: z.string().min(1).optional(),
		STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
		STRIPE_PRICE_TEAM_MONTHLY: z.string().min(1).optional(),
		STRIPE_PRICE_TEAM_YEARLY: z.string().min(1).optional(),
		STRIPE_PRICE_ENTERPRISE_MONTHLY: z.string().min(1).optional(),
		STRIPE_PRICE_ENTERPRISE_YEARLY: z.string().min(1).optional(),
		RAZORPAY_KEY_ID: z.string().min(1).optional(),
		RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
		RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
		RAZORPAY_PLAN_TEAM_MONTHLY: z.string().min(1).optional(),
		RAZORPAY_PLAN_TEAM_YEARLY: z.string().min(1).optional(),
		RAZORPAY_PLAN_ENTERPRISE_MONTHLY: z.string().min(1).optional(),
		RAZORPAY_PLAN_ENTERPRISE_YEARLY: z.string().min(1).optional(),
		AI_API_URL: z.url().default('http://localhost:8000'),
		AI_SERVICE_TOKEN: z.string().min(16).default('development-only-ai-service-token-change-me'),
		EXTERNAL_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(100).max(60_000).default(10_000),
		/** Explicitly omit in production to disable the OpenAPI page (fail-closed default). */
		SWAGGER_ENABLED: z.enum(['true', 'false']).optional(),
	})
	.superRefine((env, context) => {
		if (env.NODE_ENV !== 'production') {
			return;
		}

		const reject = (path: (string | number)[], message: string) =>
			context.addIssue({ code: 'custom', path, message });

		if (env.JWT_SECRET === developmentJwtSecret) {
			reject(['JWT_SECRET'], 'JWT_SECRET must be changed in production');
		}
		if (env.AUTH_TOKEN_SECRET === developmentTokenSecret) {
			reject(['AUTH_TOKEN_SECRET'], 'AUTH_TOKEN_SECRET must be changed in production');
		}
		if (!env.RESEND_API_KEY) {
			reject(['RESEND_API_KEY'], 'RESEND_API_KEY is required in production');
		}
		if (env.AI_SERVICE_TOKEN.startsWith('development-only')) {
			reject(['AI_SERVICE_TOKEN'], 'AI_SERVICE_TOKEN must be changed in production');
		}
		if (env.WEB_APP_URL === 'http://localhost:3000') {
			reject(['WEB_APP_URL'], 'WEB_APP_URL must be a real production URL');
		}
		if (isLocalhostUrl(env.DATABASE_URL)) {
			reject(['DATABASE_URL'], 'DATABASE_URL must not point at localhost in production');
		}
		if (env.DATABASE_SSL !== 'true' && !/(?:neon\.tech|sslmode=require)/i.test(env.DATABASE_URL)) {
			reject(['DATABASE_SSL'], 'DATABASE_SSL must be enabled in production');
		}
		if (env.CORS_ORIGIN.split(',').some((origin) => isLocalhostOrigin(origin.trim()))) {
			reject(['CORS_ORIGIN'], 'CORS_ORIGIN must not allow localhost in production');
		}
		if (env.WEBAUTHN_RP_ID === 'localhost') {
			reject(['WEBAUTHN_RP_ID'], 'WEBAUTHN_RP_ID must be a real domain in production');
		}
		if (env.WEBAUTHN_ORIGIN.split(',').some((origin) => isLocalhostOrigin(origin.trim()))) {
			reject(['WEBAUTHN_ORIGIN'], 'WEBAUTHN_ORIGIN must not be localhost in production');
		}
		if (env.AUTH_EMAIL_FROM === 'Personal OS <auth@example.com>') {
			reject(['AUTH_EMAIL_FROM'], 'AUTH_EMAIL_FROM must be a real sender in production');
		}
	});

export type Env = z.infer<typeof envSchema>;

function isLocalhostUrl(value: string): boolean {
	try {
		const hostname = new URL(value).hostname;
		return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
	} catch {
		return false;
	}
}

function isLocalhostOrigin(value: string): boolean {
	try {
		return isLocalhostUrl(value);
	} catch {
		return value.startsWith('http://localhost') || value.startsWith('http://127.0.0.1');
	}
}

export function parseEnv(env: NodeJS.ProcessEnv = process.env): Env {
	const result = envSchema.safeParse(env);
	if (result.success) {
		return result.data;
	}

	const issues = result.error.issues
		.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
		.join('; ');
	throw new Error(`Invalid environment configuration: ${issues}`);
}
