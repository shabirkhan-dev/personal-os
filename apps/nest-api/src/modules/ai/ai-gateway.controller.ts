import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { makePaginationSchema } from '@/common/schemas/pagination';
import type { AccessTokenPayload } from '@/modules/auth/auth.types';
import { CurrentUser } from '@/modules/auth/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { CreateChatSessionDto, SendMessageDto } from './ai-gateway.dto';
import { AiGatewayService } from './ai-gateway.service';

const listSessionsQuerySchema = makePaginationSchema(100, 20);
const listMessagesQuerySchema = makePaginationSchema(200, 200);

class ListSessionsQueryDto {
	static schema = listSessionsQuerySchema;
	limit!: number;
	offset!: number;
}

class ListMessagesQueryDto {
	static schema = listMessagesQuerySchema;
	limit!: number;
	offset!: number;
}

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'ai', version: '1' })
export class AiGatewayController {
	constructor(private readonly gateway: AiGatewayService) {}

	@Get('daily')
	@Throttle({ default: { limit: 30, ttl: 60_000 } })
	@ApiOperation({
		summary: 'Daily Intelligence for the current day (read-only, with source references)',
	})
	getDaily(@CurrentUser() user: AccessTokenPayload) {
		return this.gateway.getDailyIntelligence(user.sub);
	}

	@Post('chat/sessions')
	@Throttle({ default: { limit: 10, ttl: 60_000 } })
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create a chat session' })
	createSession(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateChatSessionDto) {
		return this.gateway.createSession(user.sub, body);
	}

	@Get('chat/sessions')
	@ApiOperation({ summary: 'List chat sessions (newest first)' })
	listSessions(@CurrentUser() user: AccessTokenPayload, @Query() query: ListSessionsQueryDto) {
		return this.gateway.listSessions(user.sub, query.limit, query.offset);
	}

	@Get('chat/sessions/:sessionId/messages')
	@ApiOperation({ summary: 'List messages of a chat session (oldest first)' })
	listMessages(
		@CurrentUser() user: AccessTokenPayload,
		@Param('sessionId', ParseUUIDPipe) sessionId: string,
		@Query(new ZodValidationPipe(listMessagesQuerySchema)) query: ListMessagesQueryDto,
	) {
		return this.gateway.getMessages(user.sub, sessionId, query.limit);
	}

	@Post('chat/sessions/:sessionId/messages')
	@Throttle({ default: { limit: 20, ttl: 60_000 } })
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Send a message and receive the assistant reply',
		description:
			'Context-aware read-only chat. Works for general questions too — Personal OS context is optional enrichment. The assistant never mutates data in v0.',
	})
	sendMessage(
		@CurrentUser() user: AccessTokenPayload,
		@Param('sessionId', ParseUUIDPipe) sessionId: string,
		@Body() body: SendMessageDto,
	) {
		return this.gateway.sendMessage(user.sub, sessionId, body);
	}
}
