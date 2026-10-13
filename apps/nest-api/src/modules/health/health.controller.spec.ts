import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ConfigModule } from '@/config/config.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
	let controller: HealthController;

	beforeEach(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ConfigModule],
			controllers: [HealthController],
			providers: [HealthService],
		}).compile();

		controller = moduleRef.get(HealthController);
	});

	it('returns the API health status', () => {
		expect(controller.getHealth()).toEqual({
			status: 'ok',
			service: 'starter-api',
		});
	});
});
