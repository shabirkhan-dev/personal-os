import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';

import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService login lockout', () => {
	let repository: Mocked<UsersRepository>;
	let service: UsersService;

	beforeEach(() => {
		repository = {
			incrementFailedLogin: vi.fn(async () => {}),
		} as unknown as Mocked<UsersRepository>;
		service = new UsersService(repository);
	});

	it('records a failed login via the atomic increment, not a stale absolute write', async () => {
		await service.recordFailedLogin('user-1', 5, 15);

		expect(repository.incrementFailedLogin).toHaveBeenCalledWith('user-1', 5, 15);
	});
});
