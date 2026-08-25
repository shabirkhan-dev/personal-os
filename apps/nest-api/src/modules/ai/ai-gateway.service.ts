import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AiChatMessageRecord, AiChatSessionRecord } from '@/database/schema';
import type { AccessTokenPayload } from '@/modules/auth/auth.types';
import { FinanceService } from '@/modules/finance/finance.service';
import { RoutinesService } from '@/modules/routines/routines.service';
import { AiClient } from './ai.client';
import type { ChatContext, CreateChatSessionInput, SendMessageInput } from './ai-gateway.dto';
import { AiGatewayRepository } from './ai-gateway.repository';
import type { ChatUpstreamMessage, ChatUpstreamRequest, InsightPayload } from './ai-upstream.types';

const MAX_MESSAGES_PER_SESSION = 200;
/** Bounded window of history forwarded to the model per request. */
const UPSTREAM_HISTORY_WINDOW = 20;
const MAX_LIST_SESSIONS = 100;

@Injectable()
export class AiGatewayService {
	constructor(
		private readonly repository: AiGatewayRepository,
		private readonly client: AiClient,
		private readonly routines: RoutinesService,
		private readonly finance: FinanceService,
	) {}

	async getDailyIntelligence(userId: string): Promise<{
		date: string;
		timeZone: string;
		insights: InsightPayload[];
		provider?: string;
		model?: string;
	}> {
		const today = await this.routines.getToday(userId);
		const month = today.date.slice(0, 7);
		const summary = await this.finance.getSummary(userId, month);

		const result = await this.client.dailyIntelligence({
			date: today.date,
			timeZone: today.timeZone,
			context: {
				routines: today.routines,
				financeMonth: month,
				financeSummary: summary,
			},
		});

		return {
			date: today.date,
			timeZone: today.timeZone,
			insights: result.insights,
			provider: result.provider,
			model: result.model,
		};
	}

	async createSession(userId: string, input: CreateChatSessionInput): Promise<AiChatSessionRecord> {
		return this.repository.createSession({
			userId,
			title: input.title ?? null,
			contextRoute: input.context?.route ?? null,
			contextEntityType: input.context?.entity?.type ?? null,
			contextEntityId: input.context?.entity?.id ?? null,
			contextDate: input.context?.date ?? null,
		});
	}

	async listSessions(userId: string, limit: number, offset: number) {
		const boundedLimit = Math.min(limit, MAX_LIST_SESSIONS);
		const sessions = await this.repository.listSessions(userId, boundedLimit, offset);
		return { sessions };
	}

	async getMessages(userId: string, sessionId: string, limit = 200) {
		await this.requireSession(userId, sessionId);
		const messages = await this.repository.listMessages(sessionId, userId, limit);
		return { messages };
	}

	async sendMessage(
		userId: string,
		sessionId: string,
		input: SendMessageInput,
		payload: AccessTokenPayload,
	) {
		const session = await this.requireSession(userId, sessionId);

		const total = await this.repository.countMessages(sessionId);
		if (total >= MAX_MESSAGES_PER_SESSION) {
			throw new BadRequestException({
				code: 'AI_SESSION_MESSAGE_LIMIT',
				message: 'This conversation has reached its message limit. Start a new session.',
			});
		}

		// Read prior turns before persisting the new message so the upstream
		// window is deterministic; the new message is appended explicitly.
		const priorHistory = await this.repository.listMessages(
			sessionId,
			userId,
			UPSTREAM_HISTORY_WINDOW - 1,
		);
		await this.repository.insertMessage({
			sessionId,
			userId,
			role: 'user',
			content: input.message,
		});

		const upstreamMessages: ChatUpstreamMessage[] = [
			...priorHistory.map((message) => ({
				role: message.role === 'assistant' ? ('assistant' as const) : ('user' as const),
				content: message.content,
			})),
			{ role: 'user' as const, content: input.message },
		];

		const context = mergeContext(session, input.context);
		const request: ChatUpstreamRequest = {
			messages: upstreamMessages,
			...(context ? { context } : {}),
		};
		if (!context?.entity && !context?.route && !context?.date) {
			// General chat: still ground with the user's minimal authorized daily snapshot.
			request.context = {
				...(request.context ?? {}),
				personalOS: await this.dailySnapshot(userId),
			};
		}

		const startedAt = Date.now();
		const result = await this.client.chat(request);
		const latencyMs = Date.now() - startedAt;

		const assistantMessage = await this.repository.insertMessage({
			sessionId,
			userId,
			role: 'assistant',
			content: result.reply,
			sources: result.sources ?? null,
			suggestions: result.suggestions ?? null,
			provider: result.provider ?? null,
			model: result.model ?? null,
			latencyMs,
		});
		await this.repository.touchSession(sessionId);

		return { message: assistantMessage };
	}

	/**
	 * Minimal authorized snapshot used only when the caller did not provide
	 * specific context. Keeps general chat useful without over-sharing.
	 */
	private async dailySnapshot(userId: string) {
		const today = await this.routines.getToday(userId);
		const month = today.date.slice(0, 7);
		const summary = await this.finance.getSummary(userId, month);
		return {
			date: today.date,
			routines: today.routines.map((routine) => ({
				name: routine.name,
				completedItems: routine.completedItems,
				totalItems: routine.totalItems,
			})),
			finance: {
				month: summary.month,
				incomeTotal: summary.incomeTotal,
				expenseTotal: summary.expenseTotal,
				netTotal: summary.netTotal,
			},
		};
	}

	private async requireSession(userId: string, sessionId: string): Promise<AiChatSessionRecord> {
		const session = await this.repository.findSession(userId, sessionId);
		if (!session) {
			throw new NotFoundException(`Chat session ${sessionId} not found`);
		}
		return session;
	}
}

function mergeContext(
	session: AiChatSessionRecord,
	perMessage: ChatContext | undefined,
): ChatUpstreamRequest['context'] | undefined {
	const route = perMessage?.route ?? session.contextRoute ?? undefined;
	const entityType = perMessage?.entity?.type ?? session.contextEntityType ?? undefined;
	const entityId = perMessage?.entity?.id ?? session.contextEntityId ?? undefined;
	const date = perMessage?.date ?? session.contextDate ?? undefined;

	const entity =
		entityType && entityId ? { type: String(entityType), id: String(entityId) } : undefined;
	if (!route && !entity && !date) return undefined;
	return {
		...(route ? { route } : {}),
		...(entity ? { entity } : {}),
		...(date ? { date } : {}),
	};
}
