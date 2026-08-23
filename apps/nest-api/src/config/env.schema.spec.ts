import { describe, expect, it } from 'vitest';

import { envSchema } from './env.schema';

const productionBase = {
	NODE_ENV: 'production',
	JWT_SECRET: 'a'.repeat(64),
	AUTH_TOKEN_SECRET: 'b'.repeat(64),
	RESEND_API_KEY: 're_prod_key',
	AI_SERVICE_TOKEN: 'prod-ai-token-123456789',
	WEB_APP_URL: 'https://app.example.com',
	DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/app',
	DATABASE_SSL: 'true',
	CORS_ORIGIN: 'https://app.example.com',
	WEBAUTHN_RP_ID: 'example.com',
	WEBAUTHN_ORIGIN: 'https://app.example.com',
	AUTH_EMAIL_FROM: 'Personal OS <auth@example.com>',
};

describe('envSchema production fail-closed', () => {
	it('accepts a complete production configuration', () => {
		expect(() => envSchema.parse(productionBase)).not.toThrow();
	});

	it('rejects a localhost database URL in production', () => {
		const result = envSchema.safeParse({
			...productionBase,
			DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
		});
		expect(result.success).toBe(false);
		expect(issues(result)).toContain('DATABASE_URL');
	});

	it('rejects a localhost CORS origin in production', () => {
		const result = envSchema.safeParse({
			...productionBase,
			CORS_ORIGIN: 'http://localhost:3000',
		});
		expect(result.success).toBe(false);
		expect(issues(result)).toContain('CORS_ORIGIN');
	});

	it('rejects the development email sender in production', () => {
		const result = envSchema.safeParse({
			...productionBase,
			AUTH_EMAIL_FROM: 'Starter <auth@example.com>',
		});
		expect(result.success).toBe(false);
		expect(issues(result)).toContain('AUTH_EMAIL_FROM');
	});

	it('rejects disabled TLS when the URL is not a managed host', () => {
		const result = envSchema.safeParse({
			...productionBase,
			DATABASE_SSL: 'false',
		});
		expect(result.success).toBe(false);
		expect(issues(result)).toContain('DATABASE_SSL');
	});
});

function issues(result: ReturnType<typeof envSchema.safeParse>): string[] {
	if (result.success) return [];
	return result.error.issues.map((issue) => issue.path.join('.'));
}
