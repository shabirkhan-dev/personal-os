import { useCallback, useMemo } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import { aiLimitMessage } from "@/lib/api/ai-limits";
import { dayKey } from "@/lib/day";
import { useAuth } from "@/modules/auth";

/** The Care AI, `POST /ai/care/ask`. Needs a connection and a signed-in account. */

const AI_TIMEOUT_MS = 45_000;

export type CareAnswer = { answer: string; followUps: string[] };

export function careAiMessage(error: unknown): string {
	const limit = aiLimitMessage(error);
	if (limit) return limit;
	if (error instanceof ApiError) {
		if (error.statusCode === 0) return "You're offline. This needs a connection.";
		if (error.statusCode === 401) return "Sign in again to use AI.";
		if (error.statusCode === 408) return "That took too long. Try again.";
	}
	if (error instanceof Error && error.message === "signed-out") return "Sign in to use AI.";
	return "AI couldn't do that just now. Try again in a moment.";
}

export function useCareAi() {
	const { token, status } = useAuth();
	const available = status === "signed-in" && token !== null;

	const ask = useCallback(
		async (input: {
			question: string;
			concerns: readonly string[];
			skin: readonly string[];
			routine: readonly { routine: string; name: string }[];
			ratings: Record<string, number>;
			uv: number | null;
		}): Promise<CareAnswer> => {
			if (!available || !token) throw new Error("signed-out");
			return apiClient.post<CareAnswer>(
				"/ai/care/ask",
				{
					question: input.question.slice(0, 500),
					today: dayKey(new Date()),
					concerns: input.concerns.slice(0, 12),
					skin: input.skin.slice(0, 4),
					routine: input.routine
						.slice(0, 30)
						.map((step) => ({ routine: step.routine, name: step.name.slice(0, 60) })),
					ratings: input.ratings,
					uv: input.uv,
				},
				{ accessToken: token, timeoutMs: AI_TIMEOUT_MS },
			);
		},
		[available, token],
	);

	return useMemo(() => ({ available, ask }), [available, ask]);
}
