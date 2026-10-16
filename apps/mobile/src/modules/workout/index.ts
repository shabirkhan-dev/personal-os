import type { HomeModule } from "@/modules/home/lib/module-home";
import { TrainingHomeView } from "./components/training-home-view";
import { useTrainingHero } from "./hooks/use-training-hero";
import { trainingRoutes } from "./navigation";

export { useWorkoutStatus } from "./hooks/use-training-hero";
export { type WorkoutDay, useWorkoutDay } from "./hooks/use-workout-day";

/** Training Home: a red glow, this week's sessions as the hero, Start in the header. */
export const workoutHome: HomeModule = {
	glow: "statusDanger",
	action: { icon: "Filled/Play", label: "Start today's session" },
	useHero: useTrainingHero,
	View: TrainingHomeView,
	onInsights: trainingRoutes.insights,
};
