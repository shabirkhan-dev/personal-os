import type { Category, Colour, ScentTime } from "./fashion-model";

/**
 * Starter pieces with their own photo, for "Quick add · tap what you own" and as look-alike
 * images for the person's own pieces. The photos live in `assets/fashion` (see catalog-images).
 */
export type CatalogItem = {
	id: string;
	name: string;
	category: Category;
	colour: Colour;
	scentTime?: ScentTime;
};

export const CATALOG: readonly CatalogItem[] = [
	{ id: "white-tee", name: "White tee", category: "top", colour: "white" },
	{ id: "grey-tee", name: "Grey tee", category: "top", colour: "grey" },
	{ id: "black-tee", name: "Black tee", category: "top", colour: "black" },
	{ id: "navy-polo", name: "Navy polo", category: "top", colour: "navy" },
	{ id: "white-oxford", name: "White oxford", category: "top", colour: "white" },
	{ id: "olive-overshirt", name: "Olive overshirt", category: "layer", colour: "olive" },
	{ id: "beige-overshirt", name: "Beige overshirt", category: "layer", colour: "beige" },
	{ id: "navy-blazer", name: "Navy blazer", category: "layer", colour: "navy" },
	{ id: "charcoal-chinos", name: "Charcoal chinos", category: "bottom", colour: "charcoal" },
	{ id: "navy-chinos", name: "Navy chinos", category: "bottom", colour: "navy" },
	{ id: "khaki-chinos", name: "Khaki chinos", category: "bottom", colour: "khaki" },
	{ id: "indigo-jeans", name: "Jeans", category: "bottom", colour: "indigo" },
	{ id: "white-sneakers", name: "White sneakers", category: "shoes", colour: "white" },
	{ id: "chelsea-boots", name: "Chelsea boots", category: "shoes", colour: "brown" },
	{ id: "navy-trainers", name: "Navy trainers", category: "shoes", colour: "navy" },
	{ id: "field-watch", name: "Field watch", category: "watch", colour: "silver" },
	{ id: "dress-watch", name: "Dress watch", category: "watch", colour: "brown" },
	{ id: "dive-watch", name: "Dive watch", category: "watch", colour: "navy" },
	{ id: "blue-fresh", name: "Blue fresh", category: "scent", colour: "blue", scentTime: "day" },
	{ id: "amber-oud", name: "Amber oud", category: "scent", colour: "brown", scentTime: "evening" },
	{
		id: "smoked-woods",
		name: "Smoked woods",
		category: "scent",
		colour: "black",
		scentTime: "winter",
	},
	{ id: "sunglasses", name: "Sunglasses", category: "extra", colour: "black" },
	{ id: "leather-belt", name: "Leather belt", category: "extra", colour: "brown" },
];

/** What the empty Home offers first: the pieces most people own. */
export const QUICK_ADD: readonly string[] = [
	"white-tee",
	"navy-polo",
	"charcoal-chinos",
	"indigo-jeans",
	"white-sneakers",
	"olive-overshirt",
];

export function catalogItem(id: string): CatalogItem | undefined {
	return CATALOG.find((item) => item.id === id);
}

/** The closest starter photo for a piece, by category and colour, for pieces without one. */
export function lookAlike(category: Category, colour: Colour): CatalogItem | undefined {
	const same = CATALOG.filter((item) => item.category === category);
	return same.find((item) => item.colour === colour) ?? same[0];
}
