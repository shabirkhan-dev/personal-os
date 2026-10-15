import { itemFromProduct, isBarcode } from "../lib/barcode";
import type { FoodItem } from "../lib/food-model";

/**
 * Looks a packet up in Open Food Facts, the open product database. Only the barcode leaves the
 * phone. React Native has no AbortSignal.timeout, so the timeout is a plain controller.
 */

const TIMEOUT_MS = 10_000;
const FIELDS = "product_name,product_name_en,generic_name,brands,serving_size,nutriments";

export type LookupResult =
	| { status: "ok"; item: FoodItem }
	| { status: "unknown" }
	| { status: "offline" }
	| { status: "invalid" };

export async function lookupBarcode(code: string): Promise<LookupResult> {
	if (!isBarcode(code)) return { status: "invalid" };
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const response = await fetch(
			`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`,
			{ signal: controller.signal, headers: { Accept: "application/json" } },
		);
		if (response.status === 404) return { status: "unknown" };
		if (!response.ok) return { status: "offline" };
		const item = itemFromProduct(await response.json());
		return item ? { status: "ok", item } : { status: "unknown" };
	} catch (error) {
		console.warn("[food] barcode lookup failed", error);
		return { status: "offline" };
	} finally {
		clearTimeout(timer);
	}
}
