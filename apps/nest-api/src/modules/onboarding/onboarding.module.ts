import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingRepository } from './onboarding.repository';
import { OnboardingService } from './onboarding.service';

@Module({
	imports: [AuthModule],
	controllers: [OnboardingController],
	providers: [OnboardingRepository, OnboardingService],
})
export class OnboardingModule {}
