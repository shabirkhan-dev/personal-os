import { useCallback, useMemo } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import { aiLimitMessage } from "@/lib/api/ai-limits";
import { dayKey } from "@/lib/day";
import { useAuth } from "@/modules/auth";
import type { Category } from "../lib/fashion-model";

/** The Fashion AI, `POST /ai/fashion/<task>`. Needs a connection and a signed-in account. */

const AI_TIMEOUT_MS = 45_000;

export type PieceDetailsAi = {
	name: string;
	category: Category;
	colour: string;
	size: string;
	fit: string;
	fabric: string;
	price: number | null;
	care: string;
	imageUrl: string | null;
};

export type FashionAnswer = { answer: string; outfit: string[]; followUps: string[] };

export type WardrobeLine = {
	name: string;
	category: Category;
	colour: string;
	lastWornDaysAgo: number | null;
};

export function fashionAiMessage(error: unknown): string {
	const limit = aiLimitMessage(error);
	if (limit) return limit;
	if (error instanceof ApiError) {
		if (error.statusCode === 0) return "You're offline. This needs a connection.";
		if (error.statusCode === 401) return "Sign in again to use AI.";
		if (error.statusCode === 408) return "That took too long. Try again.";
		if (error.code === "JOB_LINK_UNREADABLE")
			return "That page blocks reading. Type the piece instead.";
	}
	if (error instanceof Error && error.message === "signed-out") return "Sign in to use AI.";
	return "AI couldn't do that just now. Try again in a moment.";
}

export function useFashionAi() {
	const { token, status } = useAuth();
	const available = status === "signed-in" && token !== null;

	const call = useCallback(
		async <T>(task: string, body: Record<string, unknown>): Promise<T> => {
			if (!available || !token) throw new Error("signed-out");
			return apiClient.post<T>(`/ai/fashion/${task}`, body, {
				accessToken: token,
				timeoutMs: AI_TIMEOUT_MS,
			});
		},
		[available, token],
	);

	return useMemo(
		() => ({
			available,
			readPiece: (source: { url: string } | { text: string }) =>
				call<PieceDetailsAi>("read-piece", source),
			ask: (input: {
				question: string;
				wardrobe: readonly WardrobeLine[];
				weather: { now: number; high: number; low: number; summary: string } | null;
			}) =>
				call<FashionAnswer>("ask", {
					question: input.question.slice(0, 500),
					today: dayKey(new Date()),
					wardrobe: input.wardrobe.slice(0, 120),
					weather: input.weather,
				}),
		}),
		[available, call],
	);
}
