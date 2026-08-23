import { apiClient } from "@/lib/api/client";
import type {
	CreateRoutineInput,
	Routine,
	RoutineListQuery,
	TodayView,
	ToggleResult,
	UpdateRoutineInput,
} from "../types/routine.types";

export const routinesService = {
	getToday: (accessToken: string) => apiClient.get<TodayView>("/routines/today", { accessToken }),

	list: (accessToken: string, query?: RoutineListQuery) =>
		apiClient.get<Routine[]>("/routines", {
			accessToken,
			params: {
				limit: query?.limit ?? 100,
				offset: query?.offset ?? 0,
			},
		}),

	getById: (accessToken: string, id: string) =>
		apiClient.get<Routine>(`/routines/${id}`, { accessToken }),

	create: (accessToken: string, input: CreateRoutineInput) =>
		apiClient.post<Routine>("/routines", input, { accessToken }),

	update: (accessToken: string, id: string, input: UpdateRoutineInput) =>
		apiClient.patch<Routine>(`/routines/${id}`, input, { accessToken }),

	archive: (accessToken: string, id: string) =>
		apiClient.delete<{ id: string; archived: boolean }>(`/routines/${id}`, { accessToken }),

	toggleItem: (accessToken: string, routineId: string, itemId: string) =>
		apiClient.post<ToggleResult>(`/routines/${routineId}/items/${itemId}/toggle`, undefined, {
			accessToken,
		}),
};
