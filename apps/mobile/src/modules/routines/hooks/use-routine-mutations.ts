import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { routinesService } from "../services/routines.service";
import type { CreateRoutineInput, UpdateRoutineInput } from "../types/routine.types";

export function useToggleItemMutation() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			routineId,
			itemId,
		}: {
			routineId: string;
			itemId: string;
			completed?: boolean;
		}) => {
			if (!token) throw new Error("Authentication required");
			return routinesService.toggleItem(token, routineId, itemId);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["routines"] });
		},
	});
}

export function useCreateRoutineMutation() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateRoutineInput) => {
			if (!token) throw new Error("Authentication required");
			return routinesService.create(token, input);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["routines"] });
		},
	});
}

export function useUpdateRoutineMutation() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: UpdateRoutineInput }) => {
			if (!token) throw new Error("Authentication required");
			return routinesService.update(token, id, input);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["routines"] });
		},
	});
}

export function useArchiveRoutineMutation() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => {
			if (!token) throw new Error("Authentication required");
			return routinesService.archive(token, id);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["routines"] });
		},
	});
}
