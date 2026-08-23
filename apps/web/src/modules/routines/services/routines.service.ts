import { apiClient } from "@/lib/api/client";
import type {
	CreateRoutineInput,
	Routine,
	TodayView,
	ToggleResult,
	UpdateRoutineInput,
} from "../types/routine.types";

export const routinesService = {
	getToday: (accessToken: string) => apiClient.get<TodayView>("/routines/today", { accessToken }),
	list: (accessToken: string) => apiClient.get<Routine[]>("/routines", { accessToken }),
	get: (accessToken: string, id: string) =>
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
