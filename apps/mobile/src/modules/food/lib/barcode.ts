import { asNumber, asString, isRecord } from "@/lib/storage/parse";
import type { FoodItem } from "./food-model";

/**
 * Reads an Open Food Facts product (`/api/v2/product/<code>.json`) into one logged item: per
 * serving when the label gives a serving, else per 100 g.
 */
export function itemFromProduct(raw: unknown): FoodItem | null {
	if (!isRecord(raw) || asNumber(raw.status, 0) !== 1 || !isRecord(raw.product)) return null;
	const product = raw.product;
	const nutriments = isRecord(product.nutriments) ? product.nutriments : {};
	const name = (
		asString(product.product_name_en, "") ||
		asString(product.product_name, "") ||
		asString(product.generic_name, "")
	).trim();
	if (!name) return null;
	const brand = asString(product.brands, "").split(",")[0]?.trim() ?? "";
	const serving = asString(product.serving_size, "").trim();
	const perServing = typeof nutriments["energy-kcal_serving"] === "number";
	const read = (key: string) =>
		Math.max(0, asNumber(nutriments[`${key}_${perServing ? "serving" : "100g"}`], 0));
	const kcal = read("energy-kcal") || read("energy") / 4.184;
	if (kcal <= 0) return null;
	const title =
		brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name;
	return {
		name: title.slice(0, 60),
		quantity: 1,
		unit: perServing ? serving.slice(0, 12) || "serving" : "100 g",
		foodId: null,
		kcal: Math.round(kcal),
		protein: Math.round(read("proteins") * 10) / 10,
		carbs: Math.round(read("carbohydrates") * 10) / 10,
		fat: Math.round(read("fat") * 10) / 10,
	};
}

/** Barcodes are 8 to 14 digits (EAN-8, UPC-A, EAN-13, GTIN-14). */
export function isBarcode(code: string): boolean {
	return /^\d{8,14}$/.test(code);
}
