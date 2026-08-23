import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AppConfigService } from '@/config/app-config.service';
import { CsrfGuard } from './csrf.guard';

function makeGuard(corsOrigins = ['http://localhost:3000']): CsrfGuard {
	const config = {
		refreshCookieName: 'personal_os_refresh_token',
		corsOrigins,
	} as AppConfigService;
	return new CsrfGuard(config);
}

function makeRequest(
	overrides: { method?: string; cookies?: Record<string, string>; origin?: string } = {},
): Request {
	return {
		method: overrides.method ?? 'POST',
		cookies: overrides.cookies ?? {},
		headers: overrides.origin === undefined ? {} : { origin: overrides.origin },
	} as unknown as Request;
}

function execute(guard: CsrfGuard, request: Request): boolean | ForbiddenException {
	try {
		return guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) } as never);
	} catch (error) {
		return error as ForbiddenException;
	}
}

describe('CsrfGuard', () => {
	let guard: CsrfGuard;
	beforeEach(() => {
		guard = makeGuard();
	});

	it('allows safe methods without any check', () => {
		expect(execute(guard, makeRequest({ method: 'GET' }))).toBe(true);
	});

	it('allows non-cookie clients (no ambient refresh cookie)', () => {
		expect(execute(guard, makeRequest({ cookies: {} }))).toBe(true);
	});

	it('allows a trusted same-origin cookie request', () => {
		expect(
			execute(
				guard,
				makeRequest({
					cookies: { personal_os_refresh_token: 'abc' },
					origin: 'http://localhost:3000',
				}),
			),
		).toBe(true);
	});

	it('rejects a cookie request with a missing Origin', () => {
		const result = execute(guard, makeRequest({ cookies: { personal_os_refresh_token: 'abc' } }));
		expect(result).toBeInstanceOf(ForbiddenException);
	});

	it('rejects a cookie request with a mismatched Origin', () => {
		const result = execute(
			guard,
			makeRequest({
				cookies: { personal_os_refresh_token: 'abc' },
				origin: 'https://evil.example.com',
			}),
		);
		expect(result).toBeInstanceOf(ForbiddenException);
	});

	it('rejects a cookie request with a null Origin', () => {
		const result = execute(
			guard,
			makeRequest({ cookies: { personal_os_refresh_token: 'abc' }, origin: 'null' }),
		);
		expect(result).toBeInstanceOf(ForbiddenException);
	});
});
