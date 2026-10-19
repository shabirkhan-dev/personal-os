import { useCallback, useMemo } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import { aiLimitMessage } from "@/lib/api/ai-limits";
import { dayKey } from "@/lib/day";
import { useAuth } from "@/modules/auth";
import type { PrayerId } from "../lib/prayer-times";

/** The Faith AI, `POST /ai/faith/ask`. Needs a connection and a signed-in account. */

const AI_TIMEOUT_MS = 45_000;

export type FaithAnswer = { answer: string; followUps: string[] };

export type AskInput = {
	question: string;
	tradition: string;
	prayers: readonly PrayerId[];
	prayedToday: readonly PrayerId[];
};

/** A sentence the screen can show for any failure. */
export function faithAiMessage(error: unknown): string {
	const limit = aiLimitMessage(error);
	if (limit) return limit;
	if (error instanceof ApiError) {
		if (error.statusCode === 0)
			return "You're offline. Questions need a connection; logging works offline.";
		if (error.statusCode === 401) return "Sign in again to ask questions.";
		if (error.statusCode === 408) return "That took too long. Try again.";
	}
	if (error instanceof Error && error.message === "signed-out") return "Sign in to ask questions.";
	return "Couldn't answer just now. Try again in a moment.";
}

export function useFaithAi() {
	const { token, status } = useAuth();
	const available = status === "signed-in" && token !== null;

	const ask = useCallback(
		async (input: AskInput, now = new Date()): Promise<FaithAnswer> => {
			if (!available || !token) throw new Error("signed-out");
			return apiClient.post<FaithAnswer>(
				"/ai/faith/ask",
				{
					question: input.question.slice(0, 500),
					tradition: input.tradition,
					today: dayKey(now),
					prayers: input.prayers,
					prayedToday: input.prayedToday,
				},
				{ accessToken: token, timeoutMs: AI_TIMEOUT_MS },
			);
		},
		[available, token],
	);

	return useMemo(() => ({ available, ask }), [available, ask]);
}
