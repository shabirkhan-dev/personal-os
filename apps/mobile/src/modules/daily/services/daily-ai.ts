import { useCallback } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import { aiLimitMessage } from "@/lib/api/ai-limits";
import { useAuth } from "@/modules/auth";
import type { PlanModule } from "../lib/daily-model";

/** Daily life's AI, `POST /ai/daily/design-day`. Needs a connection and a signed-in account. */

const AI_TIMEOUT_MS = 45_000;

export type DayDraftAi = {
	blocks: { minutes: number; length: number; title: string; detail: string; module: PlanModule }[];
	note: string;
};

export function dailyAiMessage(error: unknown): string {
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

export function useDailyAi() {
	const { token, status } = useAuth();
	const available = status === "signed-in" && token !== null;
	const designDay = useCallback(
		async (input: {
			wakeAt: number;
			bedAt: number;
			blocks: readonly { minutes: number; length: number; title: string; module: PlanModule }[];
			notes: string;
		}): Promise<DayDraftAi> => {
			if (!available || !token) throw new Error("signed-out");
			return apiClient.post<DayDraftAi>(
				"/ai/daily/design-day",
				{
					wakeAt: input.wakeAt,
					bedAt: input.bedAt,
					blocks: input.blocks.slice(0, 40).map((block) => ({
						minutes: block.minutes,
						length: Math.min(600, Math.max(0, block.length)),
						title: block.title.slice(0, 60) || "Block",
						module: block.module,
					})),
					notes: input.notes.slice(0, 400),
				},
				{ accessToken: token, timeoutMs: AI_TIMEOUT_MS },
			);
		},
		[available, token],
	);
	return { available, designDay };
}
