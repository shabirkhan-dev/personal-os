import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRepository } from './auth.repository';
import { AuthCryptoService } from './auth-crypto.service';
import type { StepUpAction } from './dto/auth.dto';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import { STEP_UP_ACTION_KEY } from './step-up.decorator';

const stepUpTokenHeader = 'x-step-up-token';

function stepUpRequired(): ForbiddenException {
	return new ForbiddenException({
		code: 'AUTH_STEP_UP_REQUIRED',
		message: 'Re-authentication is required for this action',
	});
}

@Injectable()
export class StepUpGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly repository: AuthRepository,
		private readonly crypto: AuthCryptoService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredAction = this.reflector.getAllAndOverride<StepUpAction>(STEP_UP_ACTION_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (!requiredAction) {
			return true;
		}

		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const user = request.user;
		const token = request.headers[stepUpTokenHeader];
		if (!user || typeof token !== 'string' || token.length === 0) {
			throw stepUpRequired();
		}

		const challengeId = this.crypto.getChallengeId(token);
		const challenge = challengeId ? await this.repository.findChallengeById(challengeId) : null;
		const valid =
			challenge !== null &&
			challenge.purpose === 'step_up' &&
			challenge.action === requiredAction &&
			challenge.sessionId === user.sid &&
			challenge.userId === user.sub &&
			challenge.consumedAt === null &&
			challenge.expiresAt > new Date() &&
			this.crypto.verifyChallengeToken('step_up', challenge.email, token, challenge.codeHash);

		if (!valid) {
			throw stepUpRequired();
		}

		const consumed = await this.repository.consumeChallenge(challenge.id);
		if (!consumed) {
			throw stepUpRequired();
		}
		return true;
	}
}
