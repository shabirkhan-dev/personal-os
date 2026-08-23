import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { routinesService } from "../services/routines.service";

export function useToggleItemMutation() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ routineId, itemId }: { routineId: string; itemId: string }) => {
			if (!token) throw new Error("Authentication required");
			return routinesService.toggleItem(token, routineId, itemId);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["routines"] });
		},
	});
}
