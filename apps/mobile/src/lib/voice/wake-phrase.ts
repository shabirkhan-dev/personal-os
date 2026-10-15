/**
 * Does a transcript contain the wake phrase? Recognisers write "Hey OS" many ways ("hey o s",
 * "hey oh es", "hey OS.", "hey operating system"), so they are all accepted, along with "okay"
 * and "hi" in place of "hey".
 */
const WAKE =
	/\b(hey|hay|hi|okay|ok)[\s,.]+(o\s?\.?\s?s\.?|oh\s?(es|ess|s)|o\s?es|oes|ose|operating system|personal\s?o\s?s)\b/i;

export function heardWakePhrase(transcript: string): boolean {
	return WAKE.test(transcript.replace(/[’']/g, ""));
}

/** What was said after the wake phrase in the same breath ("Hey OS, prayed fajr" → "prayed fajr"). */
export function afterWakePhrase(transcript: string): string {
	const match = WAKE.exec(transcript.replace(/[’']/g, ""));
	if (!match) return "";
	return transcript
		.slice(match.index + match[0].length)
		.replace(/^[\s,.!?]+/, "")
		.trim();
}
