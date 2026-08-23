"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/context/auth-context";
import { routineQueryKeys } from "../queries/routine-query-keys";
import { routinesService } from "../services/routines.service";

export function useTodayQuery() {
	const { token } = useAuth();
	return useQuery({
		queryKey: routineQueryKeys.today(),
		queryFn: () => routinesService.getToday(requireToken(token)),
		enabled: Boolean(token),
	});
}

export function useRoutinesQuery() {
	const { token } = useAuth();
	return useQuery({
		queryKey: routineQueryKeys.list(),
		queryFn: () => routinesService.list(requireToken(token)),
		enabled: Boolean(token),
	});
}

export function useRoutineQuery(id: string) {
	const { token } = useAuth();
	return useQuery({
		queryKey: routineQueryKeys.detail(id),
		queryFn: () => routinesService.get(requireToken(token), id),
		enabled: Boolean(token) && Boolean(id),
	});
}

function requireToken(token: string | null): string {
	if (!token) throw new Error("Authentication required");
	return token;
}
