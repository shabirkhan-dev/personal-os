import { Body, Controller, Get, HttpCode, HttpStatus, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AccessTokenPayload } from '@/modules/auth/auth.types';
import { CurrentUser } from '@/modules/auth/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { SaveOnboardingDto } from './onboarding.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('Onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/onboarding', version: '1' })
export class OnboardingController {
	constructor(private readonly onboarding: OnboardingService) {}

	@Get()
	@ApiOperation({ summary: 'Get the saved onboarding answers (null before the first save)' })
	get(@CurrentUser() user: AccessTokenPayload) {
		return this.onboarding.get(user.sub);
	}

	@Put()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Save the onboarding answers' })
	save(@CurrentUser() user: AccessTokenPayload, @Body() body: SaveOnboardingDto) {
		return this.onboarding.save(user.sub, body.answers);
	}
}
