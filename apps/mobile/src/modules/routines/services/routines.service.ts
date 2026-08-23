import { apiClient } from "@/lib/api/client";
import type { TodayView, ToggleResult } from "../types/routine.types";

export const routinesService = {
	getToday: (accessToken: string) => apiClient.get<TodayView>("/routines/today", { accessToken }),
	toggleItem: (accessToken: string, routineId: string, itemId: string) =>
		apiClient.post<ToggleResult>(`/routines/${routineId}/items/${itemId}/toggle`, undefined, {
			accessToken,
		}),
};
