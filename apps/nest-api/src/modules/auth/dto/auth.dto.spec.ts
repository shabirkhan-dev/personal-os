import { describe, expect, it } from 'vitest';

import {
	changePasswordBodySchema,
	loginBodySchema,
	registerBodySchema,
	resetPasswordBodySchema,
} from './auth.dto';

const baseEmail = 'user@example.com';
const baseUsername = 'user1234';
const basePassword = 'correct horse battery staple'; // 28 ASCII bytes

/** A multi-byte password whose UTF-8 encoding exceeds 72 bytes. */
const over72Bytes = '🔐'.repeat(19); // 4 bytes * 19 = 76 bytes
const under72Bytes = '🔐'.repeat(17); // 68 bytes

describe('password byte bound (bcrypt 72-byte truncation)', () => {
	it('rejects a new password whose UTF-8 encoding exceeds 72 bytes', () => {
		const result = registerBodySchema.safeParse({
			email: baseEmail,
			username: baseUsername,
			password: over72Bytes,
		});
		expect(result.success).toBe(false);
	});

	it('accepts a multi-byte password at or under 72 bytes', () => {
		const result = registerBodySchema.safeParse({
			email: baseEmail,
			username: baseUsername,
			password: under72Bytes,
		});
		expect(result.success).toBe(true);
	});

	it('enforces the byte bound on login, reset, and change-password flows', () => {
		expect(loginBodySchema.safeParse({ email: baseEmail, password: over72Bytes }).success).toBe(
			false,
		);
		expect(
			resetPasswordBodySchema.safeParse({
				email: baseEmail,
				code: '123456',
				newPassword: over72Bytes,
			}).success,
		).toBe(false);
		expect(
			changePasswordBodySchema.safeParse({
				currentPassword: basePassword,
				newPassword: over72Bytes,
			}).success,
		).toBe(false);
	});

	it('still accepts a normal-length ASCII password', () => {
		expect(
			registerBodySchema.safeParse({
				email: baseEmail,
				username: baseUsername,
				password: basePassword,
			}).success,
		).toBe(true);
	});
});
