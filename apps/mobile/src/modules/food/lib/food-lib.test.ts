import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { itemFromProduct, isBarcode } from "./barcode";
import {
	eatenOn,
	foodNotes,
	generatePlan,
	groceriesFor,
	groceryTotal,
	itemsLine,
	nextSlot,
	pickRecipe,
	planDayMacros,
	slotRows,
	sumMacros,
	weekDays,
	weekRecap,
	weightTrend,
} from "./food-math";
import {
	defaultSettings,
	type FoodSettings,
	type Meal,
	parseMeal,
	parseSettings,
	SLOT_TIMES,
} from "./food-model";
import { FOODS } from "./foods";
import { PRODUCTS, productById } from "./groceries";
import { parseFoodLine, parseMealText, withQuantity } from "./parse-meal";
import { RECIPES } from "./recipes";
import { goalWeight, remaining, targetsFor } from "./targets";

const meal = (day: string, slot: Meal["slot"], text: string, at = `${day}T08:10:00`): Meal => ({
	id: `${day}-${slot}-${text}`,
	day,
	slot,
	items: parseMealText(text).items,
	photo: null,
	planned: false,
	recipeId: null,
	at: new Date(at).toISOString(),
});

const settings: FoodSettings = {
	...defaultSettings(),
	setUp: true,
	goal: "lean-bulk",
	targets: { kcal: 2900, protein: 140, carbs: 380, fat: 85, waterMl: 3000 },
	startKg: 64,
	goalKg: 75,
	startedOn: "2026-10-02",
};

describe("parseMealText", () => {
	it("reads the Figma breakfast line into three items", () => {
		const parse = parseMealText("2 fried eggs, one paratha and a cup of chai with milk");
		expect(parse.items.map((item) => [item.name, item.quantity])).toEqual([
			["Fried egg", 2],
			["Paratha", 1],
			["Chai with milk", 1],
		]);
		expect(sumMacros(parse.items).kcal).toBe(620);
		expect(parse.unmatched).toEqual([]);
	});

	it("finds the slot and keeps unknown words for the AI", () => {
		const parse = parseMealText("lunch quinoa bowl and daal");
		expect(parse.slot).toBe("lunch");
		expect(parse.items.map((item) => item.foodId)).toEqual(["daal"]);
		expect(parse.unmatched).toContain("quinoa");
	});

	it("lets stated calories win, or makes a custom item", () => {
		expect(parseMealText("biryani 800 kcal").items[0]?.kcal).toBe(800);
		const custom = parseMealText("shawarma 650 kcal").items[0];
		expect(custom).toMatchObject({ name: "Shawarma", kcal: 650, foodId: null });
	});

	it("scales an item to a new quantity", () => {
		const egg = parseMealText("boiled egg").items[0];
		if (!egg) throw new Error("no egg");
		expect(withQuantity(egg, 3)).toMatchObject({ quantity: 3, kcal: 234, protein: 18 });
	});
});

describe("parseFoodLine", () => {
	it("tells water, weight, screens, meals and questions apart", () => {
		expect(parseFoodLine("drank 2 glasses of water")).toEqual({ kind: "water", ml: 500 });
		expect(parseFoodLine("1.5 l water")).toEqual({ kind: "water", ml: 1500 });
		expect(parseFoodLine("weighed 65.4 kg")).toEqual({ kind: "weight", kg: 65.4 });
		expect(parseFoodLine("grocery list")).toEqual({ kind: "open", screen: "grocery" });
		expect(parseFoodLine("had daal chawal")?.kind).toBe("meal");
		expect(parseFoodLine("what should I eat for dinner?")?.kind).toBe("question");
	});
});

describe("targets", () => {
	it("gives a lean bulk near the Figma numbers for a 65 kg, 180 cm, 26 year old", () => {
		const targets = targetsFor(
			{ weightKg: 65, heightCm: 180, age: 26, sex: "male" },
			"lean-bulk",
			"active",
		);
		expect(targets.kcal).toBeGreaterThanOrEqual(2850);
		expect(targets.kcal).toBeLessThanOrEqual(3000);
		expect(targets.protein).toBe(140);
		expect(targets.waterMl).toBe(3000);
		expect(goalWeight("lean-bulk", 65)).toBe(75);
	});

	it("never leaves less than zero", () => {
		expect(
			remaining(
				{ kcal: 100, protein: 10, carbs: 0, fat: 0 },
				{ kcal: 300, protein: 5, carbs: 2, fat: 1 },
			),
		).toEqual({
			kcal: 0,
			protein: 5,
			carbs: 0,
			fat: 0,
		});
	});
});

describe("model parsing", () => {
	it("drops damaged meals and repairs settings", () => {
		expect(parseMeal({ id: "a", day: "bad", items: [{ name: "x" }] })).toBeNull();
		expect(parseMeal({ id: "a", day: "2026-10-16", items: [] })).toBeNull();
		expect(
			parseMeal({
				id: "a",
				day: "2026-10-16",
				items: [{ name: "Tea", kcal: 40 }],
				photo: "javascript:x",
			})?.photo,
		).toBeNull();
		const repaired = parseSettings({ goal: "nope", targets: { kcal: -5 }, weighInDay: 9 });
		expect(repaired).toMatchObject({ goal: "maintain", weighInDay: 6 });
		expect(repaired?.targets.kcal).toBe(defaultSettings().targets.kcal);
	});
});

describe("today", () => {
	const day = "2026-10-16";
	const meals = [
		meal(day, "breakfast", "2 fried eggs, paratha, chai"),
		meal(day, "lunch", "daal chawal and raita", `${day}T13:05:00`),
	];

	it("adds up only what was eaten", () => {
		expect(eatenOn(meals, day).kcal).toBe(620 + 560 + 90);
		expect(eatenOn(meals, "2026-10-15").kcal).toBe(0);
	});

	it("fills the five slots with logged, planned or nothing", () => {
		const rows = slotRows(
			meals,
			day,
			{ day, meals: [{ slot: "dinner", recipeId: "chicken-karahi", portions: 1 }] },
			SLOT_TIMES,
		);
		expect(rows.map((row) => row.slot)).toEqual(["breakfast", "lunch", "snack", "dinner", "bed"]);
		expect(rows[0]?.title).toBe("2 eggs, paratha, chai with milk");
		expect(rows[2]?.title).toBe("Nothing yet");
		expect(rows[3]).toMatchObject({ title: "Planned · chicken karahi", kcal: 520 });
		expect(itemsLine(meals[1]?.items ?? [])).toBe("daal chawal, raita");
	});

	it("picks the slot coming up", () => {
		expect(nextSlot(7 * 60, SLOT_TIMES)).toBe("breakfast");
		expect(nextSlot(19 * 60, SLOT_TIMES)).toBe("dinner");
		expect(nextSlot(23 * 60 + 30, SLOT_TIMES)).toBe("bed");
	});

	it("suggests a protein-heavy dinner when protein is short", () => {
		const recipe = pickRecipe("dinner", { kcal: 1280, protein: 44, carbs: 150, fat: 33 });
		expect(recipe?.protein).toBeGreaterThanOrEqual(36);
	});
});

describe("plan and groceries", () => {
	const days = weekDays(new Date("2026-10-16T12:00:00"));

	it("plans Monday to Sunday near the calorie target", () => {
		expect(days[0]).toBe("2026-10-12");
		expect(days[6]).toBe("2026-10-18");
		const plan = generatePlan(days, settings.targets);
		expect(plan).toHaveLength(7);
		for (const day of plan) {
			expect(day.meals).toHaveLength(5);
			const kcal = planDayMacros(day).kcal;
			expect(kcal).toBeGreaterThan(2000);
			expect(kcal).toBeLessThan(3800);
		}
		expect(generatePlan(days, settings.targets, 1)).not.toEqual(plan);
	});

	it("keeps days it is told to keep", () => {
		const kept = {
			day: days[0] ?? "",
			meals: [{ slot: "lunch" as const, recipeId: "chana-masala", portions: 1 }],
		};
		expect(
			generatePlan(days, settings.targets, 0, (day) => (day === kept.day ? kept : null))[0],
		).toBe(kept);
	});

	it("buys whole packs and keeps ticks", () => {
		const plan = generatePlan(days, settings.targets);
		const first = groceriesFor(plan);
		expect(first.length).toBeGreaterThan(5);
		for (const item of first) expect(item.price).toBeGreaterThan(0);
		const ticked = first.map((item, index) => ({ ...item, atHome: index === 0 }));
		const again = groceriesFor(plan, ticked);
		expect(again[0]?.atHome).toBe(true);
		expect(groceryTotal(again)).toBe(groceryTotal(first) - (first[0]?.price ?? 0));
	});
});

describe("weight and recap", () => {
	const weighIns = [
		{ id: "2026-10-02", kg: 64 },
		{ id: "2026-10-09", kg: 65 },
		{ id: "2026-10-16", kg: 65.4 },
	];

	it("shows this week's change and the way to the goal", () => {
		expect(weightTrend(weighIns, settings)).toEqual({
			latest: 65.4,
			week: 0.4,
			done: 1.4,
			total: 11,
			share: 1.4 / 11,
		});
		expect(weightTrend([], settings).week).toBeNull();
	});

	it("sums up the week and notices a light breakfast", () => {
		const days = weekDays(new Date("2026-10-16T12:00:00")).slice(0, 5);
		const meals = days.flatMap((day) => [
			meal(day, "breakfast", "paratha and chai"),
			meal(day, "lunch", "chicken pulao"),
		]);
		const recap = weekRecap(meals, weighIns, settings, days);
		expect(recap).toMatchObject({
			days: 5,
			avgKcal: 1080,
			gap: 1080 - 2900,
			proteinDays: 0,
			weightChange: 0.4,
		});
		const notes = foodNotes({ meals, water: [], settings, today: "2026-10-16", days, recap });
		expect(notes.map((note) => note.kind)).toEqual(["dinner", "breakfast", "protein-price"]);
	});
});

describe("content", () => {
	it("every recipe has a photo, valid groceries and steps", () => {
		for (const recipe of RECIPES) {
			expect(
				existsSync(join(import.meta.dir, "../../../../assets/food", `${recipe.photo}.jpg`)),
			).toBe(true);
			expect(recipe.steps.length).toBeGreaterThan(0);
			for (const use of recipe.uses) expect(productById(use.product)).toBeDefined();
		}
	});

	it("ids are unique", () => {
		expect(new Set(FOODS.map((food) => food.id)).size).toBe(FOODS.length);
		expect(new Set(PRODUCTS.map((product) => product.id)).size).toBe(PRODUCTS.length);
		expect(new Set(RECIPES.map((recipe) => recipe.id)).size).toBe(RECIPES.length);
	});
});

describe("barcode", () => {
	it("reads a product per serving, or per 100 g", () => {
		expect(isBarcode("8964000000123")).toBe(true);
		expect(isBarcode("12ab")).toBe(false);
		const serving = itemFromProduct({
			status: 1,
			product: {
				product_name: "Digestive biscuits",
				brands: "Acme",
				serving_size: "2 biscuits",
				nutriments: {
					"energy-kcal_serving": 140,
					proteins_serving: 2,
					carbohydrates_serving: 19,
					fat_serving: 6,
				},
			},
		});
		expect(serving).toMatchObject({
			name: "Acme Digestive biscuits",
			unit: "2 biscuits",
			kcal: 140,
			protein: 2,
		});
		const per100 = itemFromProduct({
			status: 1,
			product: { product_name: "Oats", nutriments: { "energy-kcal_100g": 380, proteins_100g: 13 } },
		});
		expect(per100).toMatchObject({ unit: "100 g", kcal: 380, protein: 13 });
		expect(itemFromProduct({ status: 0 })).toBeNull();
	});
});
