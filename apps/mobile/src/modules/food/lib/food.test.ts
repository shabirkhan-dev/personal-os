/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { dinnerIdeaText } from "./idea";
import {
	findRecipes,
	fitsCalories,
	isHighProtein,
	macroSplit,
	proteinCoverage,
	rankRecipes,
} from "./match";
import {
	foodStatus,
	litres,
	loggedSlotCount,
	type Meal,
	slotForTime,
	slotSummaries,
	totalsFor,
	waterGlasses,
} from "./meals";
import { parseFoodText } from "./parse-log";
import { RECIPES, recipeById } from "./recipes";
import { foodTargets, progress, remaining } from "./targets";

const DAY = "2026-10-14";

function meal(partial: Partial<Meal> & Pick<Meal, "slot" | "kcal">): Meal {
	return {
		id: `${partial.slot}-${partial.kcal}`,
		dayKey: DAY,
		name: "Food",
		at: `${DAY}T08:00:00.000Z`,
		...partial,
	};
}

describe("targets", () => {
	test("splits calories into protein, fat and carbs", () => {
		const targets = foodTargets(1950, 72);
		expect(targets.protein).toBe(115);
		expect(targets.fat).toBe(54);
		expect(targets.carbs).toBe(251);
		expect(targets.waterMl).toBe(2500);
	});

	test("remaining never goes below zero and progress is clamped", () => {
		const left = remaining(
			{ kcal: 1000, protein: 50, carbs: 100, fat: 30 },
			{ kcal: 1200, protein: 20, carbs: 50, fat: 40 },
		);
		expect(left).toEqual({ kcal: 0, protein: 30, carbs: 50, fat: 0 });
		expect(progress(150, 100)).toBe(1);
		expect(progress(0, 0)).toBe(0);
	});
});

describe("meals", () => {
	const meals: Meal[] = [
		meal({ slot: "breakfast", kcal: 420, protein: 20, carbs: 50, fat: 12 }),
		meal({ slot: "lunch", kcal: 620, protein: 25 }),
		meal({ slot: "dinner", kcal: 520, protein: 42, planned: true }),
		meal({ slot: "snack", kcal: 200, dayKey: "2026-10-13" }),
	];

	test("totals skip planned meals and other days", () => {
		expect(totalsFor(meals, DAY)).toEqual({ kcal: 1040, protein: 45, carbs: 50, fat: 12 });
	});

	test("slot summaries and the logged count", () => {
		const summaries = slotSummaries(meals, DAY);
		expect(summaries.map((s) => s.slot)).toEqual(["breakfast", "lunch", "snack", "dinner"]);
		expect(summaries[3]?.planned?.kcal).toBe(520);
		expect(summaries[3]?.eaten).toHaveLength(0);
		expect(loggedSlotCount(meals, DAY)).toBe(2);
	});

	test("status line for the module picker", () => {
		expect(foodStatus(meals, DAY, new Date(2026, 9, 14, 20))).toBe("2 meals logged");
		expect(foodStatus([], DAY, new Date(2026, 9, 14, 8))).toBe("Log breakfast");
		expect(foodStatus([meals[0] as Meal], DAY, new Date())).toBe("1 meal logged");
	});

	test("slot by time of day", () => {
		expect(slotForTime(new Date(2026, 9, 14, 7))).toBe("breakfast");
		expect(slotForTime(new Date(2026, 9, 14, 13))).toBe("lunch");
		expect(slotForTime(new Date(2026, 9, 14, 17))).toBe("snack");
		expect(slotForTime(new Date(2026, 9, 14, 21))).toBe("dinner");
		expect(slotForTime(new Date(2026, 9, 14, 1))).toBe("dinner");
	});

	test("water glasses and litres", () => {
		expect(waterGlasses(1500, 2500)).toEqual({ total: 10, filled: 6 });
		expect(waterGlasses(4000, 2500)).toEqual({ total: 10, filled: 10 });
		expect(litres(1500)).toBe("1.5");
		expect(litres(0)).toBe("0.0");
	});
});

describe("parseFoodText", () => {
	test("meal with kcal unit", () => {
		expect(parseFoodText("2 rotis and daal 450 kcal")).toEqual({
			kind: "meal",
			slot: null,
			name: "2 rotis and daal",
			kcal: 450,
		});
	});

	test("slot word and a bare trailing number", () => {
		expect(parseFoodText("lunch biryani 700")).toEqual({
			kind: "meal",
			slot: "lunch",
			name: "Biryani",
			kcal: 700,
		});
	});

	test("protein is read when given", () => {
		expect(parseFoodText("dinner chicken tikka 300 cal 40g protein")).toEqual({
			kind: "meal",
			slot: "dinner",
			name: "Chicken tikka",
			kcal: 300,
			protein: 40,
		});
	});

	test("water amounts", () => {
		expect(parseFoodText("water 500ml")).toEqual({ kind: "water", ml: 500 });
		expect(parseFoodText("1.5 L water")).toEqual({ kind: "water", ml: 1500 });
		expect(parseFoodText("2 glasses of water")).toEqual({ kind: "water", ml: 500 });
		expect(parseFoodText("water")).toEqual({ kind: "water", ml: 250 });
	});

	test("missing calories becomes a draft", () => {
		expect(parseFoodText("I had 2 rotis and daal")).toEqual({
			kind: "draft",
			slot: null,
			name: "2 rotis and daal",
			kcal: null,
		});
		expect(parseFoodText("breakfast")).toEqual({
			kind: "draft",
			slot: "breakfast",
			name: "",
			kcal: null,
		});
		expect(parseFoodText("   ")).toBeNull();
	});
});

describe("recipes", () => {
	test("every recipe is complete and its kcal matches its macros", () => {
		expect(RECIPES.length).toBeGreaterThanOrEqual(12);
		const ids = new Set(RECIPES.map((r) => r.id));
		expect(ids.size).toBe(RECIPES.length);
		for (const recipe of RECIPES) {
			expect(recipe.ingredients.length).toBeGreaterThan(0);
			expect(recipe.steps.length).toBeGreaterThan(0);
			const fromMacros = recipe.protein * 4 + recipe.carbs * 4 + recipe.fat * 9;
			expect(Math.abs(fromMacros - recipe.kcal)).toBeLessThanOrEqual(15);
		}
		expect(recipeById("chicken-karahi")?.kcal).toBe(520);
		expect(recipeById("nope")).toBeNull();
	});

	test("ranking prefers dinners that fit kcal and cover protein", () => {
		const left = { kcal: 710, protein: 48, carbs: 80, fat: 20 };
		const best = rankRecipes(RECIPES, left, "dinner")[0];
		expect(best?.slots).toContain("dinner");
		expect(best && fitsCalories(best, left)).toBe(true);
		expect(best?.protein).toBeGreaterThanOrEqual(40);
	});

	test("low calories left favours light dinners", () => {
		const left = { kcal: 300, protein: 40, carbs: 0, fat: 0 };
		const best = rankRecipes(RECIPES, left, "dinner")[0];
		expect(best?.id).toBe("chicken-tikka-boti");
	});

	test("filters and search", () => {
		const base = {
			left: { kcal: 700, protein: 40, carbs: 80, fat: 20 },
			slot: "dinner" as const,
			saved: ["fruit-chaat"],
		};
		const desi = findRecipes(RECIPES, { ...base, filter: "desi", search: "" });
		expect(desi.every((r) => r.cuisine === "Desi")).toBe(true);
		const light = findRecipes(RECIPES, { ...base, filter: "under-500", search: "" });
		expect(light.every((r) => r.kcal < 500)).toBe(true);
		const protein = findRecipes(RECIPES, { ...base, filter: "high-protein", search: "" });
		expect(protein.every(isHighProtein)).toBe(true);
		expect(findRecipes(RECIPES, { ...base, filter: "saved", search: "" }).map((r) => r.id)).toEqual(
			["fruit-chaat"],
		);
		const spinach = findRecipes(RECIPES, { ...base, filter: "for-you", search: "spinach" });
		expect(spinach.map((r) => r.id)).toEqual(["palak-paneer"]);
	});

	test("coverage and split", () => {
		const karahi = recipeById("chicken-karahi");
		if (!karahi) throw new Error("missing recipe");
		const left = { kcal: 710, protein: 48, carbs: 0, fat: 0 };
		expect(proteinCoverage(karahi, left)).toBe(88);
		expect(proteinCoverage(karahi, left, 2)).toBe(100);
		const split = macroSplit(karahi);
		expect(split.protein + split.carbs + split.fat).toBeCloseTo(1);
	});
});

function text(parts: { text: string }[]): string {
	return parts.map((part) => part.text).join("");
}

describe("dinner idea", () => {
	const karahi = recipeById("chicken-karahi");
	if (!karahi) throw new Error("missing recipe");

	test("protein still needed", () => {
		expect(text(dinnerIdeaText(karahi, { kcal: 710, protein: 40, carbs: 0, fat: 0 }, 1950))).toBe(
			"You need 40 g more protein. Chicken karahi gets you there for about 520 kcal.",
		);
		expect(text(dinnerIdeaText(karahi, { kcal: 710, protein: 48, carbs: 0, fat: 0 }, 1950))).toBe(
			"You need 48 g more protein. Chicken karahi adds 42 g of it for about 520 kcal.",
		);
	});

	test("calories used up", () => {
		expect(
			text(dinnerIdeaText(karahi, { kcal: 0, protein: 10, carbs: 0, fat: 0 }, 1950)),
		).toContain("You've reached today's 1,950 kcal");
	});
});
