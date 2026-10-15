import {
	BadGatewayException,
	BadRequestException,
	Injectable,
	Logger,
	ServiceUnavailableException,
	UnprocessableEntityException,
} from '@nestjs/common';

import { AppConfigService } from '@/config/app-config.service';
import type { AssistRequestInput, AssistResponse, CareerTask } from './ai.dto';

@Injectable()
export class AiClient {
	private readonly logger = new Logger(AiClient.name);

	constructor(private readonly config: AppConfigService) {}

	async assist(userId: string, body: AssistRequestInput): Promise<AssistResponse> {
		const url = `${this.config.aiApiUrl}/api/v1/assist`;

		let response: Response;
		try {
			response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-AI-Service-Token': this.config.aiServiceToken,
					'X-User-Id': userId,
				},
				body: JSON.stringify(body),
			});
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

	/**
	 * Runs one Career task. The AI service's own errors come back with their code: a link it could
	 * not read is a 422 the app shows as "couldn't read this link", a bad request is a 400.
	 */
	async careerTask(
		userId: string,
		task: CareerTask,
		body: Record<string, unknown>,
	): Promise<Record<string, unknown>> {
		const url = `${this.config.aiApiUrl}/api/v1/career/${task}`;

		let response: Response;
		try {
			response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-AI-Service-Token': this.config.aiServiceToken,
					'X-User-Id': userId,
				},
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(60_000),
			});
		} catch (error) {
			this.logger.error('AI API unreachable', error instanceof Error ? error.stack : undefined);
			throw new ServiceUnavailableException({
				code: 'AI_UNAVAILABLE',
				message: 'AI assistance service is unavailable',
			});
		}

		const payload: unknown = await response.json().catch(() => ({}));
		if (response.status === 422) {
			const detail = readDetail(payload);
			if (detail?.code === 'JOB_LINK_UNREADABLE') {
				throw new UnprocessableEntityException(detail);
			}
			throw new BadRequestException({
				code: 'VALIDATION_ERROR',
				message: 'The AI task request was not valid',
			});
		}
		if (!response.ok) {
			this.logger.warn(`AI API returned ${response.status} for ${task}`);
			throw new BadGatewayException({
				code: readDetail(payload)?.code ?? 'AI_UPSTREAM_ERROR',
				message: 'The AI task failed; try again',
			});
		}
		if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
			throw new BadGatewayException({
				code: 'AI_INVALID_RESPONSE',
				message: 'AI assistance returned an invalid response',
			});
		}
		return payload as Record<string, unknown>;
	}

	async health(): Promise<{ ok: boolean; provider?: string }> {
		try {
			const response = await fetch(`${this.config.aiApiUrl}/api/v1/health`);
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

function readDetail(payload: unknown): { code: string; message: string } | null {
	if (typeof payload !== 'object' || payload === null || !('detail' in payload)) return null;
	const detail = (payload as { detail: unknown }).detail;
	if (
		typeof detail === 'object' &&
		detail !== null &&
		typeof (detail as { code?: unknown }).code === 'string' &&
		typeof (detail as { message?: unknown }).message === 'string'
	) {
		return detail as { code: string; message: string };
	}
	return null;
}
