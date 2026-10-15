export type EmailMessage = { subject: string; html: string; text: string };

/** The sign-in code email. The code is digits only, so it needs no escaping. */
export function signInCodeEmail(appName: string, code: string, ttlMinutes: number): EmailMessage {
	const name = escapeHtml(appName);
	return {
		subject: `Your ${appName} sign-in code: ${code}`,
		text: `Your ${appName} sign-in code is ${code}. It expires in ${ttlMinutes} minutes. If you didn't ask for it, ignore this email.`,
		html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#171717"><h1>Sign in to ${name}</h1><p>Use this code to sign in:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in ${ttlMinutes} minutes. If you didn't ask for it, ignore this email.</p></body></html>`,
	};
}

function escapeHtml(value: string): string {
	const entities: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#039;",
	};
	return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}
