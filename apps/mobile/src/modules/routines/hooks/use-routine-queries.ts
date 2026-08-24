import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { routinesService } from "../services/routines.service";
import type { RoutineListQuery } from "../types/routine.types";

const ROUTINES_QUERY_KEY = ["routines"] as const;

// Every protected key carries the authenticated user id so cached rows can
// never resolve for a different account during sign-out/sign-in windows.
export function routinesQueryKeys(userId: string | undefined) {
	return [...ROUTINES_QUERY_KEY, userId] as const;
}

export function useTodayQuery() {
	const { token, user } = useAuth();
	return useQuery({
		queryKey: [...routinesQueryKeys(user?.id), "today"],
		queryFn: () => {
			if (!token || !user) throw new Error("Authentication required");
			return routinesService.getToday(token);
		},
		enabled: Boolean(token && user),
	});
}

export function useRoutinesListQuery(query?: RoutineListQuery) {
	const { token, user } = useAuth();
	return useQuery({
		queryKey: [...routinesQueryKeys(user?.id), "list", query],
		queryFn: () => {
			if (!token || !user) throw new Error("Authentication required");
			return routinesService.list(token, query);
		},
		enabled: Boolean(token && user),
	});
}

export function useRoutineQuery(id?: string) {
	const { token, user } = useAuth();
	return useQuery({
		queryKey: [...routinesQueryKeys(user?.id), "detail", id],
		queryFn: () => {
			if (!token || !user || !id) throw new Error("Authentication and valid routine ID required");
			return routinesService.getById(token, id);
		},
		enabled: Boolean(token && user && id),
	});
}
