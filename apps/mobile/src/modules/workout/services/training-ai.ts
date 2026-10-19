import { useCallback, useMemo } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import { aiLimitMessage } from "@/lib/api/ai-limits";
import { dayKey } from "@/lib/day";
import { useAuth } from "@/modules/auth";

/** The Training AI, `POST /ai/training/<task>`. Needs a connection and a signed-in account. */

const AI_TIMEOUT_MS = 45_000;

export type TrainingAnswer = { answer: string; followUps: string[] };

export function trainingAiMessage(error: unknown): string {
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

export function useTrainingAi() {
	const { token, status } = useAuth();
	const available = status === "signed-in" && token !== null;

	const call = useCallback(
		async <T>(task: string, body: Record<string, unknown>): Promise<T> => {
			if (!available || !token) throw new Error("signed-out");
			return apiClient.post<T>(`/ai/training/${task}`, body, {
				accessToken: token,
				timeoutMs: AI_TIMEOUT_MS,
			});
		},
		[available, token],
	);

	return useMemo(
		() => ({
			available,
			ask: (input: {
				question: string;
				sports: readonly string[];
				phase: number;
				week: readonly { day: string; title: string; status: string }[];
				recent: readonly { day: string; title: string; line: string }[];
			}) =>
				call<TrainingAnswer>("ask", {
					question: input.question.slice(0, 500),
					today: dayKey(new Date()),
					sports: input.sports.slice(0, 12),
					phase: input.phase,
					week: input.week.slice(0, 7),
					recent: input.recent.slice(0, 10),
				}),
			skill: (name: string, sport: string) =>
				call<{ steps: string[] }>("skill", { name: name.slice(0, 60), sport }),
		}),
		[available, call],
	);
}
