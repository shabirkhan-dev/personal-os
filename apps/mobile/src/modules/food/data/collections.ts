import { defineCollection } from "@/lib/db/collection";
import {
	parseGrocery,
	parseMeal,
	parsePlan,
	parseRecipeState,
	parseSettings,
	parseWater,
	parseWeighIn,
} from "../lib/food-model";

/** Food's slices of the record store. Names are part of the sync contract: never rename one. */
export const meals = defineCollection("food-meals", parseMeal);
export const water = defineCollection("food-water", parseWater);
export const weighIns = defineCollection("food-weights", parseWeighIn);
export const foodSettings = defineCollection("food-settings", parseSettings);
export const foodPlans = defineCollection("food-plans", parsePlan);
export const groceries = defineCollection("food-grocery", parseGrocery);
export const recipeStates = defineCollection("food-recipes", parseRecipeState);
