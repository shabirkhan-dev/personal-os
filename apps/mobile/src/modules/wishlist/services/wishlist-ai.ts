import { useCallback, useMemo } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import { aiLimitMessage } from "@/lib/api/ai-limits";
import { dayKey } from "@/lib/day";
import { useAuth } from "@/modules/auth";
import type { DreamCategory } from "../lib/wishlist-model";

/** The Wishlist AI, `POST /ai/wishlist/<task>`. Needs a connection and a signed-in account. */

const AI_TIMEOUT_MS = 45_000;

export type DreamFound = {
	name: string;
	category: DreamCategory;
	/** Up to three versions with a typical cash price in Pakistan. */
	options: { label: string; price: number }[];
	priceLow: number;
	priceHigh: number;
	fits: string;
};

export function wishlistAiMessage(error: unknown): string {
	const limit = aiLimitMessage(error);
	if (limit) return limit;
	if (error instanceof ApiError) {
		if (error.statusCode === 0) return "You're offline. Add the price yourself for now.";
		if (error.statusCode === 401) return "Sign in again to look up prices.";
		if (error.statusCode === 408) return "That took too long. Try again.";
	}
	if (error instanceof Error && error.message === "signed-out") {
		return "Sign in to look up prices. You can add it yourself meanwhile.";
	}
	return "Couldn't look that up just now. Add the price yourself or try again.";
}

export function useWishlistAi() {
	const { token, status } = useAuth();
	const available = status === "signed-in" && token !== null;

	const call = useCallback(
		async <T>(task: string, body: Record<string, unknown>): Promise<T> => {
			if (!available || !token) throw new Error("signed-out");
			return apiClient.post<T>(`/ai/wishlist/${task}`, body, {
				accessToken: token,
				timeoutMs: AI_TIMEOUT_MS,
			});
		},
		[available, token],
	);

	return useMemo(
		() => ({
			available,
			find: (text: string) =>
				call<DreamFound>("find", { text: text.trim().slice(0, 300), today: dayKey(new Date()) }),
		}),
		[available, call],
	);
}
