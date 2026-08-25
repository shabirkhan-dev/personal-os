import {
	BadGatewayException,
	Injectable,
	Logger,
	ServiceUnavailableException,
} from '@nestjs/common';

import { fetchWithTimeout } from '@/common/http/fetch-with-timeout';
import { AppConfigService } from '@/config/app-config.service';
import type { AssistRequestInput, AssistResponse } from './ai.dto';
import type {
	ChatUpstreamRequest,
	ChatUpstreamResponse,
	DailyIntelligenceUpstreamRequest,
	DailyIntelligenceUpstreamResponse,
} from './ai-upstream.types';

@Injectable()
export class AiClient {
	private readonly logger = new Logger(AiClient.name);

	constructor(private readonly config: AppConfigService) {}

	async assist(userId: string, body: AssistRequestInput): Promise<AssistResponse> {
		const url = `${this.config.aiApiUrl}/api/v1/assist`;

		let response: Response;
		try {
			response = await fetchWithTimeout(
				url,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-AI-Service-Token': this.config.aiServiceToken,
						'X-User-Id': userId,
					},
					body: JSON.stringify(body),
				},
				this.config.externalRequestTimeoutMs,
			);
		} catch (error) {
			this.logger.error('AI API unreachable', error instanceof Error ? error.stack : undefined);
			throw new ServiceUnavailableException({
				code: 'AI_UNAVAILABLE',
				message: 'AI assistance service is unavailable',
			});
		}

		const payload: unknown = await response.json().catch(() => ({}));

		if (!response.ok) {
			this.logger.warn(`AI API returned ${response.status}`);
			throw new BadGatewayException({
				code: 'AI_UPSTREAM_ERROR',
				message: 'AI assistance upstream request failed',
			});
		}

		if (!isAssistResponse(payload)) {
			throw new BadGatewayException({
				code: 'AI_INVALID_RESPONSE',
				message: 'AI assistance returned an invalid response',
			});
		}

		return payload;
	}

	async health(): Promise<{ ok: boolean; provider?: string }> {
		try {
			const response = await fetchWithTimeout(
				`${this.config.aiApiUrl}/api/v1/health`,
				{},
				this.config.externalRequestTimeoutMs,
			);
			if (!response.ok) {
				return { ok: false };
			}
			const payload: unknown = await response.json();
			if (
				typeof payload === 'object' &&
				payload !== null &&
				'provider' in payload &&
				typeof (payload as { provider: unknown }).provider === 'string'
			) {
				return { ok: true, provider: (payload as { provider: string }).provider };
			}
			return { ok: true };
		} catch {
			return { ok: false };
		}
	}

	/** Daily Intelligence generation against the internal ai-api. */
	dailyIntelligence(
		request: DailyIntelligenceUpstreamRequest,
	): Promise<DailyIntelligenceUpstreamResponse> {
		return this.postStructured(
			'/api/v1/intelligence/daily',
			request,
			isDailyIntelligenceResponse,
			'AI_INVALID_INSIGHT_RESPONSE',
		);
	}

	/** Context-aware read-only chat against the internal ai-api. */
	chat(request: ChatUpstreamRequest): Promise<ChatUpstreamResponse> {
		return this.postStructured('/api/v1/chat', request, isChatResponse, 'AI_INVALID_CHAT_RESPONSE');
	}

	private async postStructured<T>(
		path: string,
		body: unknown,
		isValid: (value: unknown) => value is T,
		invalidCode: string,
	): Promise<T> {
		let response: Response;
		try {
			response = await fetchWithTimeout(
				`${this.config.aiApiUrl}${path}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-AI-Service-Token': this.config.aiServiceToken,
					},
					body: JSON.stringify(body),
				},
				this.config.externalRequestTimeoutMs,
			);
		} catch (error) {
			this.logger.error(
				`AI upstream ${path} unreachable`,
				error instanceof Error ? error.stack : undefined,
			);
			throw new ServiceUnavailableException({
				code: 'AI_UNAVAILABLE',
				message: 'AI assistance service is unavailable',
			});
		}

		const payload: unknown = await response.json().catch(() => ({}));
		if (!response.ok) {
			this.logger.warn(`AI upstream ${path} returned ${response.status}`);
			throw new BadGatewayException({
				code: 'AI_UPSTREAM_ERROR',
				message: 'AI assistance upstream request failed',
			});
		}
		if (!isValid(payload)) {
			throw new BadGatewayException({
				code: invalidCode,
				message: 'AI assistance returned an invalid response',
			});
		}
		return payload;
	}
}

function isAssistResponse(value: unknown): value is AssistResponse {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const record = value as Record<string, unknown>;
	return (
		typeof record.reply === 'string' &&
		typeof record.provider === 'string' &&
		typeof record.model === 'string'
	);
}

function isDailyIntelligenceResponse(value: unknown): value is DailyIntelligenceUpstreamResponse {
	if (
		typeof value !== 'object' ||
		value === null ||
		!Array.isArray((value as { insights?: unknown[] }).insights)
	) {
		return false;
	}
	return (value as { insights: unknown[] }).insights.every(isInsightPayload);
}

function isInsightPayload(insight: unknown): boolean {
	if (typeof insight !== 'object' || insight === null) return false;
	const record = insight as Record<string, unknown>;
	return (
		typeof record.id === 'string' &&
		typeof record.kind === 'string' &&
		typeof record.priority === 'string' &&
		typeof record.title === 'string' &&
		typeof record.detail === 'string' &&
		Array.isArray(record.sourceRefs)
	);
}

function isChatResponse(value: unknown): value is ChatUpstreamResponse {
	if (typeof value !== 'object' || value === null) return false;
	return typeof (value as { reply?: unknown }).reply === 'string';
}
