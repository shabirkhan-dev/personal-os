import type { HomeModule } from "@/modules/home/lib/module-home";
import { WorkoutHomeView } from "./components/workout-home-view";
import { useWorkoutHero } from "./hooks/use-workout-hero";

export { useWorkoutStatus } from "./hooks/use-workout-status";
export { type WorkoutDay, useWorkoutDay } from "./hooks/use-workout-day";
export { useWorkoutStore } from "./store/workout-store";

/** Workout Home: red glow, Start workout in the header, kcal burned today as the hero. */
export const workoutHome: HomeModule = {
	glow: "statusDanger",
	action: { icon: "Filled/Play", label: "Start workout" },
	useHero: useWorkoutHero,
	View: WorkoutHomeView,
};
