import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { AppConfigService } from '@/config/app-config.service';
import type { AuthChallengeRecord, UserRecord } from '@/database/schema';
import { EmailService } from '@/modules/email/email.service';
import { MfaService } from '@/modules/mfa/mfa.service';
import { PasskeysService } from '@/modules/passkeys/passkeys.service';
import { SocialAuthService } from '@/modules/social-auth/social-auth.service';
import { UsersService } from '@/modules/users/users.service';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthCryptoService } from './auth-crypto.service';

const user: UserRecord = {
	id: 'a01a0cab-a947-44f0-bfcd-4b8e8c907534',
	email: 'starter@example.com',
	username: 'starter',
	passwordHash: 'password-hash',
	emailVerifiedAt: null,
	isActive: true,
	failedLoginAttempts: 0,
	lockedUntil: null,
	passwordChangedAt: new Date('2026-07-13T00:00:00.000Z'),
	createdAt: new Date('2026-07-13T00:00:00.000Z'),
	updatedAt: new Date('2026-07-13T00:00:00.000Z'),
};

describe('AuthService', () => {
	let authRepository: Mocked<AuthRepository>;
	let crypto: Mocked<AuthCryptoService>;
	let email: Mocked<EmailService>;
	let usersService: Mocked<UsersService>;
	let service: AuthService;

	beforeEach(() => {
		authRepository = {
			createChallenge: vi.fn(),
		} as unknown as Mocked<AuthRepository>;
		crypto = {
			hashPassword: vi.fn().mockResolvedValue('password-hash'),
			generateOtp: vi.fn().mockReturnValue('123456'),
			hashOtp: vi.fn().mockReturnValue('otp-hash'),
		} as unknown as Mocked<AuthCryptoService>;
		email = {
			sendVerificationCode: vi.fn().mockResolvedValue(undefined),
			sendPasswordResetCode: vi.fn().mockResolvedValue(undefined),
			sendSignInCode: vi.fn().mockResolvedValue(undefined),
		} as unknown as Mocked<EmailService>;
		usersService = {
			createUser: vi.fn().mockResolvedValue(user),
			createEmailOnlyUser: vi.fn().mockResolvedValue({ ...user, passwordHash: null }),
			findByEmail: vi.fn().mockResolvedValue(null),
		} as unknown as Mocked<UsersService>;
		service = new AuthService(
			new AppConfigService(),
			crypto,
			email,
			authRepository,
			usersService,
			{ isTotpEnabled: vi.fn().mockResolvedValue(false) } as unknown as MfaService,
			{} as PasskeysService,
			{} as SocialAuthService,
		);
	});

	it('registers a user and persists only a hashed verification code', async () => {
		authRepository.createChallenge.mockResolvedValue({
			id: '84c5bd4b-2a8f-4a89-85db-c22f45dc2ab9',
			userId: user.id,
			email: user.email,
			purpose: 'email_verification',
			codeHash: 'otp-hash',
			attempts: 0,
			expiresAt: new Date(Date.now() + 600_000),
			consumedAt: null,
			createdAt: new Date(),
		} satisfies AuthChallengeRecord);

		const result = await service.register({
			email: user.email,
			username: user.username,
			password: 'a-strong-test-password',
		});

		expect(authRepository.createChallenge).toHaveBeenCalledWith(
			expect.objectContaining({ codeHash: 'otp-hash' }),
		);
		expect(authRepository.createChallenge).not.toHaveBeenCalledWith(
			expect.objectContaining({ codeHash: '123456' }),
		);
		expect(email.sendVerificationCode).toHaveBeenCalledWith(user.email, '123456');
		expect(result.user).not.toHaveProperty('passwordHash');
		expect(result.developmentCode).toBe('123456');
	});

	it('never includes a refresh token in the public session response', () => {
		const result = service.toPublicSession({
			accessToken: 'access-token',
			accessTokenExpiresAt: '2026-07-13T00:15:00.000Z',
			refreshToken: 'refresh-token',
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				isActive: true,
				emailVerified: false,
				hasPassword: true,
				createdAt: user.createdAt.toISOString(),
			},
		});

		expect(result).not.toHaveProperty('refreshToken');
	});

	it('includes the refresh token for native client session responses', () => {
		const session = {
			accessToken: 'access-token',
			accessTokenExpiresAt: '2026-07-13T00:15:00.000Z',
			refreshToken: 'refresh-token',
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				isActive: true,
				emailVerified: false,
				hasPassword: true,
				createdAt: user.createdAt.toISOString(),
			},
		};

		expect(service.toClientSession(session, true)).toEqual(session);
		expect(service.toClientSession(session, false)).not.toHaveProperty('refreshToken');
	});

	it('creates a passwordless account on the first email-code request', async () => {
		const result = await service.requestEmailCode({ email: user.email, name: 'Shabir' });

		expect(usersService.createEmailOnlyUser).toHaveBeenCalledWith({
			email: user.email,
			displayName: 'Shabir',
		});
		expect(authRepository.createChallenge).toHaveBeenCalledWith(
			expect.objectContaining({ purpose: 'email_sign_in', codeHash: 'otp-hash' }),
		);
		expect(email.sendSignInCode).toHaveBeenCalledWith(user.email, '123456');
		expect(result).toMatchObject({ accepted: true, message: 'A sign-in code has been sent.' });
	});

	it('reuses an existing account for an email-code request', async () => {
		usersService.findByEmail.mockResolvedValue(user);

		await service.requestEmailCode({ email: user.email });

		expect(usersService.createEmailOnlyUser).not.toHaveBeenCalled();
		expect(email.sendSignInCode).toHaveBeenCalledWith(user.email, '123456');
	});

	it('sends no code to a deactivated account but answers the same way', async () => {
		usersService.findByEmail.mockResolvedValue({ ...user, isActive: false });

		const result = await service.requestEmailCode({ email: user.email });

		expect(email.sendSignInCode).not.toHaveBeenCalled();
		expect(result).toMatchObject({ accepted: true, message: 'A sign-in code has been sent.' });
	});

	it('rejects an email-code verification for an unknown account', async () => {
		await expect(
			service.verifyEmailCode(
				{ email: user.email, code: '123456' },
				{ userAgent: null, ipAddress: null },
			),
		).rejects.toMatchObject({ status: 401 });
	});
});
