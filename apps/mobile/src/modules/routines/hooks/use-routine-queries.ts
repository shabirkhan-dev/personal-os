import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { routinesService } from "../services/routines.service";
import type { RoutineListQuery } from "../types/routine.types";

export const ROUTINES_QUERY_KEY = ["routines"] as const;

export function routinesQueryKeys() {
	return ROUTINES_QUERY_KEY;
}

export function useTodayQuery() {
	const { token } = useAuth();
	return useQuery({
		queryKey: [...ROUTINES_QUERY_KEY, "today"],
		queryFn: () => {
			if (!token) throw new Error("Authentication required");
			return routinesService.getToday(token);
		},
		enabled: Boolean(token),
	});
}

export function useRoutinesListQuery(query?: RoutineListQuery) {
	const { token } = useAuth();
	return useQuery({
		queryKey: [...ROUTINES_QUERY_KEY, "list", query],
		queryFn: () => {
			if (!token) throw new Error("Authentication required");
			return routinesService.list(token, query);
		},
		enabled: Boolean(token),
	});
}

export function useRoutineQuery(id?: string) {
	const { token } = useAuth();
	return useQuery({
		queryKey: [...ROUTINES_QUERY_KEY, "detail", id],
		queryFn: () => {
			if (!token || !id) throw new Error("Authentication and valid routine ID required");
			return routinesService.getById(token, id);
		},
		enabled: Boolean(token && id),
	});
}
