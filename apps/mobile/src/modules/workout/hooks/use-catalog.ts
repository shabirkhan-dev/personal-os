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
	source: readonly CatalogExercise[];
	byName: ReadonlyMap<string, CatalogExercise>;
	sync: () => void;
}>((set, get) => ({
	source: CATALOG,
	byName: byName(CATALOG),
	// Only a changed merged list updates state, so syncing can never loop.
	sync: () => {
		const source = allExercises();
		if (source !== get().source) set({ source, byName: byName(source) });
	},
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
