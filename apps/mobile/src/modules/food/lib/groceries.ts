import type { GrocerySection } from "./food-model";

/**
 * What a recipe's ingredients are bought as: a pack, its size and a rough Rupee price. The
 * grocery list adds up what the week's recipes need and rounds up to whole packs.
 */
export type GroceryProduct = {
	id: string;
	name: string;
	section: GrocerySection;
	/** How much one pack is, in `unit`. */
	pack: number;
	unit: "kg" | "g" | "L" | "" | "dozen" | "bunch";
	price: number;
};

const p = (
	id: string,
	name: string,
	section: GrocerySection,
	pack: number,
	unit: GroceryProduct["unit"],
	price: number,
): GroceryProduct => ({ id, name, section, pack, unit, price });

export const PRODUCTS: readonly GroceryProduct[] = [
	p("eggs", "Eggs", "protein", 30, "", 1000),
	p("chicken", "Chicken", "protein", 1, "kg", 800),
	p("milk", "Milk", "protein", 1, "L", 220),
	p("yogurt", "Yogurt", "protein", 1, "kg", 300),
	p("daal-masoor", "Daal masoor", "protein", 1, "kg", 380),
	p("chana", "Chana", "protein", 1, "kg", 320),
	p("rice", "Rice", "carbs", 1, "kg", 300),
	p("oats", "Oats", "carbs", 500, "g", 330),
	p("bananas", "Bananas", "carbs", 1, "dozen", 240),
	p("atta", "Atta", "carbs", 5, "kg", 700),
	p("bread", "Bread", "carbs", 1, "", 180),
	p("fruit", "Seasonal fruit", "carbs", 1, "kg", 400),
	p("tomatoes", "Tomatoes", "veg", 1, "kg", 160),
	p("onions", "Onions", "veg", 1, "kg", 140),
	p("ginger-garlic", "Ginger and garlic", "veg", 250, "g", 120),
	p("chillies", "Green chillies", "veg", 250, "g", 60),
	p("coriander", "Fresh coriander", "veg", 1, "bunch", 30),
	p("cucumber", "Cucumber", "veg", 1, "kg", 120),
	p("masala", "Spice mix", "veg", 100, "g", 150),
	p("oil", "Cooking oil", "extras", 1, "L", 560),
	p("peanut-butter", "Peanut butter", "extras", 340, "g", 300),
	p("apricots", "Dried apricots", "extras", 500, "g", 600),
	p("walnuts", "Walnuts", "extras", 250, "g", 700),
	p("honey", "Honey", "extras", 250, "g", 450),
];

export function productById(id: string): GroceryProduct | undefined {
	return PRODUCTS.find((item) => item.id === id);
}

/** "2 kg", "500 g", "30", "1 dozen", "2 bunches". */
export function packLabel(product: GroceryProduct, packs: number): string {
	const amount = product.pack * packs;
	if (product.unit === "") return String(amount);
	if (product.unit === "bunch") return `${amount} bunch${amount === 1 ? "" : "es"}`;
	return `${amount} ${product.unit}`;
}
