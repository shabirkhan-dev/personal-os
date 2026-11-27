import { isAiTaskPath, runAiTask } from "@personal-os/ai";
import { useCallback, useEffect, useMemo } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/modules/auth";
import { ownAiConfig, useOwnAi } from "./own-ai";

/**
 * How a module's AI runs: with the person's own key, straight from the phone; otherwise through
 * the Personal OS server for a signed-in account. `available` is false with neither.
 */
export function useAi() {
	const { token, status } = useAuth();
	const { own, hydrated, hydrate } = useOwnAi();
	useEffect(() => {
		if (!hydrated) hydrate().catch((error: unknown) => console.warn("[ai] hydrate failed", error));
	}, [hydrated, hydrate]);
	const signedIn = status === "signed-in" && token !== null;
	const available = own !== null || signedIn;

	const run = useCallback(
		async <T>(path: string, body: Record<string, unknown>, timeoutMs: number): Promise<T> => {
			if (own) {
				if (!isAiTaskPath(path)) throw new Error(`Unknown AI task ${path}`);
				return (await runAiTask(ownAiConfig(own), path, body)) as T;
			}
			if (!signedIn || !token) throw new Error("signed-out");
			return apiClient.post<T>(`/ai/${path}`, body, { accessToken: token, timeoutMs });
		},
		[own, signedIn, token],
	);

	return useMemo(() => ({ available, ownKey: own !== null, run }), [available, own, run]);
}
