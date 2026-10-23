import { useCallback, useMemo } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import { aiLimitMessage } from "@/lib/api/ai-limits";
import { dayKey } from "@/lib/day";
import { useAuth } from "@/modules/auth";
import { type DraftRequest, draftCatalog, type ProgramDraft } from "../lib/programs/draft";

/** The Training AI, `POST /ai/training/<task>`. Needs a connection and a signed-in account. */

const AI_TIMEOUT_MS = 45_000;
/** A whole program takes the model longer than an answer. */
const PROGRAM_TIMEOUT_MS = 90_000;

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
		async <T>(
			task: string,
			body: Record<string, unknown>,
			timeoutMs = AI_TIMEOUT_MS,
		): Promise<T> => {
			if (!available || !token) throw new Error("signed-out");
			return apiClient.post<T>(`/ai/training/${task}`, body, { accessToken: token, timeoutMs });
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
			program: (request: DraftRequest) =>
				call<ProgramDraft>(
					"program",
					{
						goal: request.goal.slice(0, 300),
						level: request.level,
						weeks: request.weeks,
						daysPerWeek: request.daysPerWeek,
						minutes: request.minutes,
						sports: request.sports.slice(0, 12),
						equipment: request.equipment.slice(0, 10),
						exercises: draftCatalog(request.equipment).slice(0, 150),
					},
					PROGRAM_TIMEOUT_MS,
				),
		}),
		[available, call],
	);
}
