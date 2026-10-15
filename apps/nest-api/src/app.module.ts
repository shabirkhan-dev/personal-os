import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ConfigModule } from '@/config/config.module';
import { DatabaseModule } from '@/database/database.module';
import { AiModule } from '@/modules/ai/ai.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { HealthModule } from '@/modules/health/health.module';
import { OnboardingModule } from '@/modules/onboarding/onboarding.module';
import { ProfilesModule } from '@/modules/profiles/profiles.module';
import { SyncModule } from '@/modules/sync/sync.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
	imports: [
		ConfigModule,
		DatabaseModule,
		ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
		HealthModule,
		UsersModule,
		AuthModule,
		ProfilesModule,
		OnboardingModule,
		SyncModule,
		AiModule,
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
