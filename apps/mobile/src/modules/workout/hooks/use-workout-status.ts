import { useEffect } from "react";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { workoutStatus } from "../lib/status";
import { useNow } from "./use-now";
import { useWorkoutStore } from "../store/workout-store";

/** Module picker line: "Workout at 18:30", "3 workouts this week" or "Log your first workout". */
export function useWorkoutStatus(): string {
	const sessions = useWorkoutStore((state) => state.data.sessions);
	const hydrate = useWorkoutStore((state) => state.hydrate);
	const workdays = useOnboardingStore((state) => state.workdays);
	const now = useNow();
	useEffect(() => {
		hydrate();
	}, [hydrate]);
	return workoutStatus(sessions, workdays, now);
}
