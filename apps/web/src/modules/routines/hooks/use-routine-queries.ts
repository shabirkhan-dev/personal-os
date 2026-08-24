"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/modules/auth/context/auth-context";
import { routineQueryKeys } from "../queries/routine-query-keys";
import { routinesService } from "../services/routines.service";

const noRetryOnApiErrors = (failureCount: number, error: unknown): boolean =>
	error instanceof ApiError ? false : failureCount < 2;

export function useTodayQuery() {
	const { token } = useAuth();
	return useQuery({
		queryKey: routineQueryKeys.today(),
		queryFn: () => routinesService.getToday(requireToken(token)),
		enabled: Boolean(token),
		retry: noRetryOnApiErrors,
	});
}

export function useRoutinesQuery() {
	const { token } = useAuth();
	return useQuery({
		queryKey: routineQueryKeys.list(),
		queryFn: () => routinesService.list(requireToken(token)),
		enabled: Boolean(token),
		retry: noRetryOnApiErrors,
	});
}

export function useRoutineQuery(id: string) {
	const { token } = useAuth();
	return useQuery({
		queryKey: routineQueryKeys.detail(id),
		queryFn: () => routinesService.get(requireToken(token), id),
		enabled: Boolean(token) && Boolean(id),
		retry: noRetryOnApiErrors,
	});
}

function requireToken(token: string | null): string {
	if (!token) throw new Error("Authentication required");
	return token;
}
