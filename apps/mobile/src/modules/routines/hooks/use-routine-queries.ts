import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { routinesService } from "../services/routines.service";

const ROUTINES_QUERY_KEY = ["routines"] as const;

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
