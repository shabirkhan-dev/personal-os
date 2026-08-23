import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';

import { MfaService } from '@/modules/mfa/mfa.service';
import { PasskeysService } from '@/modules/passkeys/passkeys.service';
import { SocialAuthService } from '@/modules/social-auth/social-auth.service';
import { AuthService } from './auth.service';
import type { AccessTokenPayload } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import {
	GoogleCredentialBodyDto,
	PasskeyRegistrationBodyDto,
	StepUpBodyDto,
	TotpCodeBodyDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequireStepUp } from './step-up.decorator';
import { StepUpGuard } from './step-up.guard';

@ApiTags('Account security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'auth/security', version: '1' })
export class AuthSecurityController {
	constructor(
		private readonly mfa: MfaService,
		private readonly passkeys: PasskeysService,
		private readonly social: SocialAuthService,
		private readonly authService: AuthService,
	) {}

	@Get()
	@ApiOperation({ summary: 'Get MFA, passkey, and social-identity status' })
	async status(@CurrentUser() user: AccessTokenPayload) {
		const [mfa, passkeys, social] = await Promise.all([
			this.mfa.getStatus(user.sub),
			this.passkeys.list(user.sub),
			this.social.getStatus(user.sub),
		]);
		return { mfa, passkeys, social };
	}

	@Post('step-up')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Obtain a single-use step-up token for a security action',
		description:
			'Requires the current password. Use the returned token in the X-Step-Up-Token header.',
	})
	stepUp(@CurrentUser() user: AccessTokenPayload, @Body() body: StepUpBodyDto) {
		return this.authService.beginStepUp(user, body.password, body.action);
	}

	@Post('totp/setup')
	@RequireStepUp('totp')
	@UseGuards(StepUpGuard)
	beginTotp(@CurrentUser() user: AccessTokenPayload) {
		return this.mfa.beginTotpSetup(user.sub);
	}

	@Post('totp/confirm')
	@RequireStepUp('totp')
	@UseGuards(StepUpGuard)
	confirmTotp(@CurrentUser() user: AccessTokenPayload, @Body() body: TotpCodeBodyDto) {
		return this.mfa.confirmTotpSetup(user.sub, body.code);
	}

	@Post('totp/disable')
	@RequireStepUp('totp')
	@UseGuards(StepUpGuard)
	disableTotp(@CurrentUser() user: AccessTokenPayload, @Body() body: TotpCodeBodyDto) {
		return this.mfa.disableTotp(user.sub, body.code);
	}

	@Post('passkeys/options')
	@RequireStepUp('passkey')
	@UseGuards(StepUpGuard)
	beginPasskey(@CurrentUser() user: AccessTokenPayload) {
		return this.passkeys.beginRegistration(user.sub);
	}

	@Post('passkeys')
	@RequireStepUp('passkey')
	@UseGuards(StepUpGuard)
	registerPasskey(
		@CurrentUser() user: AccessTokenPayload,
		@Body() body: PasskeyRegistrationBodyDto,
	) {
		return this.passkeys.finishRegistration({
			userId: user.sub,
			challengeId: body.challengeId,
			name: body.name,
			response: body.response as unknown as RegistrationResponseJSON,
		});
	}

	@Delete('passkeys/:passkeyId')
	@RequireStepUp('passkey')
	@UseGuards(StepUpGuard)
	deletePasskey(
		@CurrentUser() user: AccessTokenPayload,
		@Param('passkeyId', new ParseUUIDPipe({ version: '4' })) passkeyId: string,
	) {
		return this.passkeys.remove(user.sub, passkeyId);
	}

	@Post('google/link')
	@RequireStepUp('social_link')
	@UseGuards(StepUpGuard)
	linkGoogle(@CurrentUser() user: AccessTokenPayload, @Body() body: GoogleCredentialBodyDto) {
		return this.social.linkGoogle(user.sub, body.credential);
	}
}
