import { useCallback } from "react";
import { useAi } from "@/lib/ai/use-ai";
import { ApiError } from "@/lib/api/client";
import { aiLimitMessage } from "@/lib/api/ai-limits";
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
	if (error instanceof Error && error.message === "signed-out")
		return "Sign in, or add your own AI key in Settings.";
	return "AI couldn't do that just now. Try again in a moment.";
}

export function useDailyAi() {
	const { available, run } = useAi();
	const designDay = useCallback(
		async (input: {
			wakeAt: number;
			bedAt: number;
			blocks: readonly { minutes: number; length: number; title: string; module: PlanModule }[];
			notes: string;
		}): Promise<DayDraftAi> => {
			if (!available) throw new Error("signed-out");
			return run<DayDraftAi>(
				"daily/design-day",
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
				AI_TIMEOUT_MS,
			);
		},
		[available, run],
	);
	return { available, designDay };
}
