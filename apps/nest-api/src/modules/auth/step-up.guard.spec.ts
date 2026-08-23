import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import type { AuthRepository } from './auth.repository';
import type { AuthCryptoService } from './auth-crypto.service';
import { STEP_UP_ACTION_KEY } from './step-up.decorator';
import { StepUpGuard } from './step-up.guard';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const sessionId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const challengeId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const token = `${challengeId}.somesecret`;

function makeChallenge(overrides: Record<string, unknown> = {}) {
	return {
		id: challengeId,
		userId,
		email: 'user@example.com',
		purpose: 'step_up' as const,
		codeHash: 'hash',
		attempts: 0,
		expiresAt: new Date(Date.now() + 300_000),
		consumedAt: null,
		action: 'totp',
		sessionId,
		createdAt: new Date(),
		...overrides,
	};
}

describe('StepUpGuard', () => {
	let repository: Mocked<AuthRepository>;
	let crypto: Mocked<AuthCryptoService>;
	let reflector: Mocked<Reflector>;
	let guard: StepUpGuard;

	beforeEach(() => {
		repository = {
			findChallengeById: vi.fn(async () => makeChallenge()),
			consumeChallenge: vi.fn(async () => true),
		} as unknown as Mocked<AuthRepository>;
		crypto = {
			getChallengeId: vi.fn(() => challengeId),
			verifyChallengeToken: vi.fn(() => true),
		} as unknown as Mocked<AuthCryptoService>;
		reflector = {
			getAllAndOverride: vi.fn(() => 'totp'),
		} as unknown as Mocked<Reflector>;
		guard = new StepUpGuard(reflector, repository, crypto);
	});

	function run(
		headers: Record<string, string | undefined>,
		user = { sub: userId, sid: sessionId },
	) {
		return guard.canActivate({
			getHandler: () => ({}),
			getClass: () => ({}),
			switchToHttp: () => ({ getRequest: () => ({ headers, user }) }),
		} as never);
	}

	it('passes a valid, action-matching, session-matching step-up token and consumes it', async () => {
		await expect(run({ 'x-step-up-token': token })).resolves.toBe(true);
		expect(repository.consumeChallenge).toHaveBeenCalledWith(challengeId);
	});

	it('rejects when no step-up token is provided', async () => {
		await expect(run({})).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('rejects a token bound to a different action', async () => {
		repository.findChallengeById.mockResolvedValue(makeChallenge({ action: 'passkey' }));
		await expect(run({ 'x-step-up-token': token })).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('rejects a token bound to a different session', async () => {
		repository.findChallengeById.mockResolvedValue(makeChallenge({ sessionId: 'other-session' }));
		await expect(run({ 'x-step-up-token': token })).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('rejects an already-consumed challenge', async () => {
		repository.findChallengeById.mockResolvedValue(makeChallenge({ consumedAt: new Date() }));
		await expect(run({ 'x-step-up-token': token })).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('rejects when the atomic consume loses to a concurrent request', async () => {
		repository.consumeChallenge.mockResolvedValue(false);
		await expect(run({ 'x-step-up-token': token })).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('requires a step-up action to be declared', async () => {
		reflector.getAllAndOverride.mockReturnValue(undefined);
		await expect(run({})).resolves.toBe(true);
		expect(STEP_UP_ACTION_KEY).toBe('stepUpAction');
	});
});
