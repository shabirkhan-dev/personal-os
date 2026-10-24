import { create } from "zustand";
import {
	allExercises,
	CATALOG,
	type CatalogExercise,
	type ExerciseGuide,
} from "../lib/exercise-guide";

const byName = (list: readonly CatalogExercise[]) =>
	new Map(list.map((exercise) => [exercise.name, exercise]));

/**
 * The merged exercises (built-in, the person's changes and their own) as state, so components that
 * show an exercise update when it changes. The plain lookups in `exercise-guide` stay for pure code;
 * the React Compiler would treat them as never changing inside a component.
 */
export const useCatalog = create<{
	byName: ReadonlyMap<string, CatalogExercise>;
	sync: () => void;
}>((set) => ({
	byName: byName(CATALOG),
	sync: () => set({ byName: byName(allExercises()) }),
}));

/** An exercise's guide (demo, cues, media), updating when the person changes the exercise. */
export function useGuide(name: string): ExerciseGuide | null {
	const exercise = useCatalog((state) => state.byName.get(name) ?? null);
	if (!exercise || exercise.pattern === "sport") return null;
	return {
		demo: exercise.demo,
		cues: exercise.cues,
		...(exercise.media ? { media: exercise.media } : {}),
	};
}
