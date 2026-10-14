import { formatKcal, type Macros } from "./meals";
import type { Recipe } from "./recipes";

/** A sentence in pieces; `strong` pieces render in text/primary. */
export type IdeaPart = { text: string; strong?: boolean };

/** The Dinner idea sentence, built from what is left today and the suggested recipe. */
export function dinnerIdeaText(recipe: Recipe, left: Macros, targetKcal: number): IdeaPart[] {
	const name = { text: recipe.name, strong: true };
	const kcal = `about ${formatKcal(recipe.kcal)} kcal`;
	if (left.kcal <= 0) {
		return [
			{ text: "You've reached today's " },
			{ text: `${formatKcal(targetKcal)} kcal`, strong: true },
			{ text: ". If you're still hungry, " },
			name,
			{ text: ` is a lighter pick at ${kcal}.` },
		];
	}
	if (left.protein > 0) {
		const covers = recipe.protein >= left.protein;
		return [
			{ text: "You need " },
			{ text: `${Math.round(left.protein)} g more protein`, strong: true },
			{ text: ". " },
			name,
			{
				text: covers
					? ` gets you there for ${kcal}.`
					: ` adds ${recipe.protein} g of it for ${kcal}.`,
			},
		];
	}
	return [
		{ text: "Protein is covered. " },
		name,
		{ text: ` fits in the ` },
		{ text: `${formatKcal(left.kcal)} kcal`, strong: true },
		{ text: ` you have left, at ${kcal}.` },
	];
}
