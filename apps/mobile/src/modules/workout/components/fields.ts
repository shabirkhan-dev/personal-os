import { workoutTypes, type Feel, type WorkoutType, typeLabel } from "../lib/types";

export const typeOptions = workoutTypes.map((value) => ({ value, label: typeLabel[value] }));

export const feelOptions: readonly { value: Feel; label: string }[] = [
	{ value: "easy", label: "Easy" },
	{ value: "good", label: "Good" },
	{ value: "hard", label: "Hard" },
];

/** Positive number typed in a field ("5,2" works too), or null. */
export function readNumber(text: string): number | null {
	const value = Number(text.trim().replace(",", "."));
	return text.trim() && Number.isFinite(value) && value > 0 ? value : null;
}

export const DISTANCE_TYPES: readonly WorkoutType[] = ["run", "walk", "cycle"];
