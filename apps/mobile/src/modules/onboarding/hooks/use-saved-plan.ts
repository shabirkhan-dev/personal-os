import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/context/auth-context";
import { onboardingService, type RemoteOnboarding } from "../services/onboarding.service";

export type SavedPlan =
	| { kind: "signed-out" }
	| { kind: "checking" }
	| { kind: "found"; plan: RemoteOnboarding }
	| { kind: "none" }
	| { kind: "error"; retry: () => void };

/**
 * Whether the signed-in account already has an onboarding plan (`GET /users/me/onboarding`), so a
 * reinstall or a new phone can restore it instead of starting over or overwriting it.
 */
export function useSavedPlan(): SavedPlan {
	const { status, token, user } = useAuth();
	const signedIn = status === "signed-in" && token !== null && user !== null;
	const query = useQuery({
		// Keyed by account, so a different sign-in never sees another account's answer.
		queryKey: ["onboarding", "saved-plan", user?.id ?? null],
		queryFn: () => {
			if (!token) throw new Error("Sign in to look for a saved plan");
			return onboardingService.get(token);
		},
		enabled: signedIn,
		staleTime: 0,
		gcTime: 0,
		retry: 1,
	});

	if (!signedIn) return { kind: "signed-out" };
	if (query.isPending) return { kind: "checking" };
	if (query.isError) {
		return {
			kind: "error",
			retry: () => {
				query.refetch().catch((error: unknown) => {
					console.warn("[onboarding] could not look for a saved plan", error);
				});
			},
		};
	}
	return query.data ? { kind: "found", plan: query.data } : { kind: "none" };
}
