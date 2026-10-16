import type { GroceryItem } from "./food-model";

const stem = (word: string) => word.replace(/(es|s)$/, "");

/** Grocery items still to buy that a line of spending names ("Chicken · 1 kg" → Chicken breast). */
export function groceryMatches(items: readonly GroceryItem[], spent: readonly string[]): string[] {
	const said = new Set(
		spent.flatMap((name) =>
			name
				.toLowerCase()
				.split(/[^a-z]+/)
				.filter((word) => word.length >= 3)
				.map(stem),
		),
	);
	return items
		.filter((item) => !item.bought && !item.atHome)
		.filter((item) =>
			item.name
				.toLowerCase()
				.split(/[^a-z]+/)
				.some((word) => word.length >= 3 && said.has(stem(word))),
		)
		.map((item) => item.id);
}
