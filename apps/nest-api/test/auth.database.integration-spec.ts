import 'dotenv/config';

import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppConfigService } from '@/config/app-config.service';
import { DatabaseService } from '@/database/database.service';
import { users } from '@/database/schema';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthCryptoService } from '@/modules/auth/auth-crypto.service';
import { EmailService } from '@/modules/email/email.service';
import { MfaService } from '@/modules/mfa/mfa.service';
import { PasskeysService } from '@/modules/passkeys/passkeys.service';
import { SocialAuthService } from '@/modules/social-auth/social-auth.service';
import { UsersRepository } from '@/modules/users/users.repository';
import { UsersService } from '@/modules/users/users.service';

describe('database-backed authentication', () => {
	const config = new AppConfigService();
	const database = new DatabaseService(config);
	const crypto = new AuthCryptoService(config);
	const authRepository = new AuthRepository(database);
	const usersService = new UsersService(new UsersRepository(database));
	const email = {
		sendVerificationCode: vi.fn().mockResolvedValue(undefined),
		sendPasswordResetCode: vi.fn().mockResolvedValue(undefined),
		sendSignInCode: vi.fn().mockResolvedValue(undefined),
	} as unknown as EmailService;
	const auth = new AuthService(
		config,
		crypto,
		email,
		authRepository,
		usersService,
		{ isTotpEnabled: vi.fn().mockResolvedValue(false) } as unknown as MfaService,
		{} as PasskeysService,
		{} as SocialAuthService,
	);
	const emailAddress = `auth-integration-${randomUUID()}@example.com`;
	const codeEmailAddress = `auth-code-${randomUUID()}@example.com`;

	beforeAll(async () => {
		await database.db.delete(users).where(eq(users.email, emailAddress));
	});

	it('signs up and signs in with an email code, verifying the address', async () => {
		const request = await auth.requestEmailCode({ email: codeEmailAddress, name: 'Code User' });
		expect(request.developmentCode).toMatch(/^\d{6}$/);
		const created = await usersService.findByEmail(codeEmailAddress);
		expect(created?.emailVerifiedAt).toBeNull();
		expect(created?.passwordHash).toBeNull();

		await expect(
			auth.verifyEmailCode(
				{
					email: codeEmailAddress,
					code: request.developmentCode === '000000' ? '111111' : '000000',
				},
				{ ipAddress: '127.0.0.1', userAgent: 'integration-test' },
			),
		).rejects.toMatchObject({ status: 401 });

		const session = await auth.verifyEmailCode(
			{ email: codeEmailAddress, code: request.developmentCode ?? '' },
			{ ipAddress: '127.0.0.1', userAgent: 'integration-test' },
		);
		expect(session.user.emailVerified).toBe(true);
		expect(session.refreshToken).toBeTruthy();

		const again = await auth.requestEmailCode({ email: codeEmailAddress });
		const second = await auth.verifyEmailCode(
			{ email: codeEmailAddress, code: again.developmentCode ?? '' },
			{ ipAddress: '127.0.0.1', userAgent: 'integration-test' },
		);
		expect(second.user.id).toBe(session.user.id);
	});

	it('completes registration, verification, login, rotation, and password change', async () => {
		const password = 'integration-password-one';
		const registration = await auth.register({
			email: emailAddress,
			username: `user_${randomUUID().replaceAll('-', '').slice(0, 12)}`,
			password,
		});
		expect(registration.developmentCode).toMatch(/^\d{6}$/);

		const verified = await auth.verifyEmail({
			email: emailAddress,
			code: registration.developmentCode ?? '',
		});
		expect(verified.emailVerified).toBe(true);

		const login = await auth.login(
			{ email: emailAddress, password },
			{ ipAddress: '127.0.0.1', userAgent: 'integration-test' },
		);
		if ('requiresTwoFactor' in login) throw new Error('Unexpected two-factor challenge');
		await expect(auth.authenticateAccessToken(login.accessToken)).resolves.toMatchObject({
			sub: verified.id,
		});

		const refreshed = await auth.refresh(login.refreshToken);
		expect(refreshed.refreshToken).not.toBe(login.refreshToken);

		const current = await auth.authenticateAccessToken(refreshed.accessToken);
		const sessions = await auth.listSessions(current);
		expect(sessions).toHaveLength(1);
		expect(sessions[0]?.isCurrent).toBe(true);

		await auth.changePassword(current, {
			currentPassword: password,
			newPassword: 'integration-password-two',
		});
	});

	afterAll(async () => {
		await database.db.delete(users).where(eq(users.email, emailAddress));
		await database.db.delete(users).where(eq(users.email, codeEmailAddress));
		await database.onModuleDestroy();
	});
});
