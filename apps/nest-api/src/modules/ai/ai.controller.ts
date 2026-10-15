import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import type { AccessTokenPayload } from '@/modules/auth/auth.types';
import { CurrentUser } from '@/modules/auth/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import {
	AssistRequestDto,
	assistRequestSchema,
	careerTaskBodySchema,
	careerTaskSchema,
	type CareerTask,
} from './ai.dto';
import { AiService } from './ai.service';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'ai', version: '1' })
export class AiController {
	constructor(private readonly ai: AiService) {}

	@Get('status')
	@ApiOperation({ summary: 'Check AI assistance upstream availability' })
	status() {
		return this.ai.status();
	}

	@Post('assist')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'In-app AI assistance (proxied to FastAPI)' })
	assist(
		@CurrentUser() user: AccessTokenPayload,
		@Body(new ZodValidationPipe(assistRequestSchema)) body: AssistRequestDto,
	) {
		return this.ai.assist(user.sub, body);
	}

	@Post('career/:task')
	@HttpCode(HttpStatus.OK)
	@Throttle({ default: { limit: 20, ttl: 60_000 } })
	@ApiOperation({
		summary: 'Run a Career AI task (read-job, parse-line, nudge, interview-prep, skill-path)',
	})
	careerTask(
		@CurrentUser() user: AccessTokenPayload,
		@Param('task', new ZodValidationPipe(careerTaskSchema)) task: CareerTask,
		@Body(new ZodValidationPipe(careerTaskBodySchema)) body: Record<string, unknown>,
	) {
		return this.ai.careerTask(user.sub, task, body);
	}
}
