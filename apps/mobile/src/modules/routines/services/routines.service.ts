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

	list: (accessToken: string, query?: RoutineListQuery) => {
		const searchParams = new URLSearchParams();
		if (query?.limit !== undefined) searchParams.set("limit", String(query.limit));
		if (query?.offset !== undefined) searchParams.set("offset", String(query.offset));
		const qs = searchParams.toString();
		return apiClient.get<Routine[]>(`/routines${qs ? `?${qs}` : ""}`, { accessToken });
	},

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
