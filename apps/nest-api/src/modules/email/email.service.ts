import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

import {
	fetchWithTimeout,
	isAbortError,
	UpstreamTimeoutError,
} from '@/common/http/fetch-with-timeout';
import { AppConfigService } from '@/config/app-config.service';
import { magicLinkEmail, passwordResetEmail, verificationEmail } from './email.templates';

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);

	constructor(private readonly config: AppConfigService) {}

	sendVerificationCode(to: string, code: string): Promise<void> {
		return this.send(to, verificationEmail(code));
	}

	sendPasswordResetCode(to: string, code: string): Promise<void> {
		return this.send(to, passwordResetEmail(code));
	}

	sendMagicLink(to: string, url: string): Promise<void> {
		return this.send(to, magicLinkEmail(url));
	}

	private async send(to: string, message: { subject: string; html: string }): Promise<void> {
		if (!this.config.resendApiKey) {
			return;
		}

		let response: Response;
		try {
			response = await fetchWithTimeout(
				'https://api.resend.com/emails',
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${this.config.resendApiKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						from: this.config.authEmailFrom,
						to: [to],
						subject: message.subject,
						html: message.html,
					}),
				},
				this.config.externalRequestTimeoutMs,
			);
		} catch (error) {
			if (error instanceof UpstreamTimeoutError || isAbortError(error)) {
				this.logger.error(`Resend timed out after ${this.config.externalRequestTimeoutMs}ms`);
				throw new ServiceUnavailableException({
					code: 'EMAIL_PROVIDER_TIMEOUT',
					message: 'The email provider did not respond in time. Please try again.',
				});
			}
			this.logger.error(
				'Email provider request failed',
				error instanceof Error ? error.stack : undefined,
			);
			throw new ServiceUnavailableException({
				code: 'EMAIL_PROVIDER_UNREACHABLE',
				message: 'The email service is temporarily unavailable.',
			});
		}

		if (!response.ok) {
			const providerError = await readProviderError(response);
			this.logger.warn(
				`Resend rejected an email request: status=${response.status} code=${providerError.name ?? 'unknown'} message=${providerError.message ?? 'none'}`,
			);
			throw new ServiceUnavailableException({
				code: 'EMAIL_DELIVERY_FAILED',
				message: deliveryFailureMessage(response.status),
			});
		}
	}
}

type ProviderError = { name?: string; message?: string };

async function readProviderError(response: Response): Promise<ProviderError> {
	const payload: unknown = await response.json().catch(() => null);
	if (!payload || typeof payload !== 'object') return {};
	const record = payload as Record<string, unknown>;
	return {
		...(typeof record.name === 'string' ? { name: record.name } : {}),
		...(typeof record.message === 'string' ? { message: record.message } : {}),
	};
}

function deliveryFailureMessage(status: number): string {
	if (status === 401) return 'The email provider rejected the configured API key.';
	if (status === 403 || status === 422) {
		return 'The email sender is not authorized. Verify the AUTH_EMAIL_FROM domain in Resend.';
	}
	if (status === 429)
		return 'Email delivery is temporarily rate limited. Please try again shortly.';
	return 'The email could not be delivered. Please try again.';
}
