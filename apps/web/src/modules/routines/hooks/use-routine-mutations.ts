"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/context/auth-context";
import { routineQueryKeys } from "../queries/routine-query-keys";
import { routinesService } from "../services/routines.service";
import type { CreateRoutineInput, UpdateRoutineInput } from "../types/routine.types";

export function useCreateRoutineMutation() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateRoutineInput) => routinesService.create(requireToken(token), input),
		onSuccess: () => invalidateAll(queryClient),
	});
}

export function useUpdateRoutineMutation() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: UpdateRoutineInput }) =>
			routinesService.update(requireToken(token), id, input),
		onSuccess: () => invalidateAll(queryClient),
	});
}

export function useArchiveRoutineMutation() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => routinesService.archive(requireToken(token), id),
		onSuccess: () => invalidateAll(queryClient),
	});
}

export function useToggleItemMutation() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ routineId, itemId }: { routineId: string; itemId: string }) =>
			routinesService.toggleItem(requireToken(token), routineId, itemId),
		onSuccess: () => invalidateAll(queryClient),
	});
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({ queryKey: routineQueryKeys.all });
}

function requireToken(token: string | null): string {
	if (!token) throw new Error("Authentication required");
	return token;
}
