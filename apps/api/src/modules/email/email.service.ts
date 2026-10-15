import type { Config } from "@/config/env";
import { AppError } from "@/core/app-error";
import type { EmailMessage } from "./email.templates";

/** Sends through Resend. Without a key (development) nothing is sent; the code is in the reply. */
export async function sendEmail(config: Config, to: string, message: EmailMessage): Promise<void> {
	const apiKey = config.email.resendApiKey;
	if (!apiKey) return;

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
		body: JSON.stringify({ from: config.email.from, to: [to], ...message }),
	});
	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		console.error(`[email] Resend answered ${response.status}: ${detail.slice(0, 300)}`);
		throw new AppError("EMAIL_DELIVERY_FAILED");
	}
}
