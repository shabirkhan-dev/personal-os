import type { Card, ListItem } from "@personal-os/domain/assistant";
import { newId } from "@personal-os/domain/dates";
import {
	defaultSettings,
	type FoodItem,
	type Macros,
	type Meal,
	parseMeal,
	parseMealText,
	parseSettings,
	parseWater,
	parseWeighIn,
	SLOT_LABELS,
	SLOT_TIMES,
	SLOTS,
	type Slot,
	ZERO,
} from "@personal-os/domain/food";
import * as z from "zod";

import { getRecord, listRecords, putRecord } from "../assistant.records";
import { localClock, localDate, zonedToDate } from "../assistant.time";
import { defineTool, type ToolContext, ToolError } from "../assistant.tool";

const MEALS = "food-meals";
const WATER = "food-water";
const WEIGHTS = "food-weights";

const round1 = (value: number) => Math.round(value * 10) / 10;

function sum(items: readonly Macros[]): Macros {
	const total = { ...ZERO };
	for (const item of items) {
		total.kcal += item.kcal;
		total.protein += item.protein;
		total.carbs += item.carbs;
		total.fat += item.fat;
	}
	return {
		kcal: Math.round(total.kcal),
		protein: round1(total.protein),
		carbs: round1(total.carbs),
		fat: round1(total.fat),
	};
}

/** Green once a "more is better" target (protein, water) is met; red when a cap is passed. */
const tone = (used: number, limit: number, more: boolean) =>
	more ? (used >= limit ? "success" : "accent") : used > limit * 1.05 ? "danger" : "accent";

const today = (ctx: ToolContext) => localDate(ctx.now, ctx.context.timeZone);

/** The slot for now: the latest one whose usual time has passed (breakfast before 8 am). */
function slotNow(ctx: ToolContext): Slot {
	const local = localClock(ctx.now, ctx.context.timeZone).now;
	const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
	let slot: Slot = "breakfast";
	for (const each of SLOTS) if (minutes >= SLOT_TIMES[each] - 60) slot = each;
	return slot;
}

async function load(ctx: ToolContext) {
	const [settingsRows, meals, water, weights] = await Promise.all([
		listRecords(ctx.db, ctx.userId, "food-settings", parseSettings),
		listRecords(ctx.db, ctx.userId, MEALS, parseMeal),
		listRecords(ctx.db, ctx.userId, WATER, parseWater),
		listRecords(ctx.db, ctx.userId, WEIGHTS, parseWeighIn),
	]);
	return {
		settings: settingsRows[0] ?? defaultSettings(),
		meals: meals.filter((meal) => !meal.planned),
		water,
		weights: weights.toSorted((a, b) => a.id.localeCompare(b.id)),
	};
}

function mealItem(meal: Meal): ListItem {
	const total = sum(meal.items);
	return {
		id: meal.id,
		title: SLOT_LABELS[meal.slot],
		subtitle: meal.items
			.map((item) => `${item.quantity !== 1 ? `${item.quantity} ` : ""}${item.name}`)
			.join(", "),
		value: `${total.kcal} kcal`,
	};
}

const mealBrief = (meal: Meal) => ({
	id: meal.id,
	day: meal.day,
	slot: meal.slot,
	items: meal.items.map((item) =>
		`${item.quantity} ${item.unit} ${item.name}`.replace(/\s+/g, " ").trim(),
	),
	...sum(meal.items),
});

const shortDay = (day: string) =>
	new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });

const foodToday = defineTool({
	name: "food_today",
	description:
		"One day's eating against the targets: calories, protein, carbs, fat and water, with each meal. Today unless a day is given. Call it for 'what have I eaten', 'how much protein left', 'can I have…'.",
	input: z.object({ day: z.iso.date().optional() }).strict(),
	effect: "read",
	label: () => "Checking what you've eaten",
	run: async (ctx, input) => {
		const day = input.day ?? today(ctx);
		const { settings, meals, water } = await load(ctx);
		const eatenMeals = meals
			.filter((meal) => meal.day === day)
			.toSorted((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));
		const eaten = sum(eatenMeals.flatMap((meal) => meal.items));
		const ml = water.find((each) => each.id === day)?.ml ?? 0;
		const t = settings.targets;
		const left = {
			kcal: Math.max(0, t.kcal - eaten.kcal),
			protein: round1(Math.max(0, t.protein - eaten.protein)),
			waterMl: Math.max(0, t.waterMl - ml),
		};
		const cards: Card[] = [
			{
				kind: "progress",
				title: `${day === today(ctx) ? "Today" : shortDay(day)} · ${eaten.kcal} of ${t.kcal} kcal`,
				items: [
					{
						label: "Calories",
						used: eaten.kcal,
						limit: t.kcal,
						text: `${eaten.kcal} / ${t.kcal}`,
						tone: tone(eaten.kcal, t.kcal, false),
					},
					{
						label: "Protein",
						used: eaten.protein,
						limit: t.protein,
						text: `${eaten.protein} / ${t.protein} g`,
						tone: tone(eaten.protein, t.protein, true),
					},
					{
						label: "Carbs",
						used: eaten.carbs,
						limit: t.carbs,
						text: `${eaten.carbs} / ${t.carbs} g`,
						tone: tone(eaten.carbs, t.carbs, false),
					},
					{
						label: "Fat",
						used: eaten.fat,
						limit: t.fat,
						text: `${eaten.fat} / ${t.fat} g`,
						tone: tone(eaten.fat, t.fat, false),
					},
					{
						label: "Water",
						used: ml,
						limit: t.waterMl,
						text: `${(ml / 1000).toFixed(1)} / ${(t.waterMl / 1000).toFixed(1)} L`,
						tone: tone(ml, t.waterMl, true),
					},
				],
			},
			{
				kind: "list",
				title: "Meals",
				empty: "Nothing logged yet.",
				items: eatenMeals.map(mealItem),
			},
		];
		return {
			result: {
				day,
				goal: settings.goal,
				targets: t,
				eaten,
				waterMl: ml,
				left,
				meals: eatenMeals.map(mealBrief),
			},
			cards,
		};
	},
});

const foodWeek = defineTool({
	name: "food_week",
	description:
		"The last seven days: calories and protein each day against the targets, the average, and the weight trend toward the goal. Use it for 'how's my diet', 'am I eating enough protein', 'am I losing weight'.",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Looking at your week of eating",
	run: async (ctx) => {
		const { settings, meals, weights } = await load(ctx);
		const end = localClock(ctx.now, ctx.context.timeZone).now;
		const days = Array.from({ length: 7 }, (_, index) =>
			new Date(end.getTime() - (6 - index) * 86_400_000).toISOString().slice(0, 10),
		);
		const perDay = days.map((day) =>
			Object.assign(
				{ day },
				sum(meals.filter((meal) => meal.day === day).flatMap((meal) => meal.items)),
			),
		);
		const logged = perDay.filter((day) => day.kcal > 0);
		const average = logged.length > 0 ? sum(logged).kcal / logged.length : 0;
		const proteinAverage =
			logged.length > 0
				? round1(logged.reduce((total, day) => total + day.protein, 0) / logged.length)
				: 0;
		const latest = weights.at(-1);
		const cards: Card[] = [
			{
				kind: "chart",
				title: `Calories · target ${settings.targets.kcal}`,
				style: "columns",
				unit: "kcal",
				points: perDay.map((day) => ({
					label: shortDay(day.day),
					value: day.kcal,
					display: `${day.kcal} kcal`,
					tone:
						day.kcal === 0
							? "neutral"
							: day.kcal > settings.targets.kcal * 1.1
								? "caution"
								: "accent",
				})),
				note:
					logged.length > 0
						? `About ${Math.round(average)} kcal and ${proteinAverage} g protein a day on the ${logged.length} days logged.`
						: "Nothing logged this week.",
			},
		];
		if (latest) {
			const change = round1(latest.kg - settings.startKg);
			cards.push({
				kind: "metric",
				label: "Weight",
				value: `${latest.kg} kg`,
				detail: `${change > 0 ? "+" : ""}${change} kg since the start · goal ${settings.goalKg} kg`,
				tone: "accent",
			});
		}
		return {
			result: {
				targets: settings.targets,
				days: perDay.map(({ day, kcal, protein }) => ({ day, kcal, protein })),
				averageKcal: Math.round(average),
				averageProtein: proteinAverage,
				weight: latest
					? { kg: latest.kg, on: latest.id, startKg: settings.startKg, goalKg: settings.goalKg }
					: null,
			},
			cards,
		};
	},
});

const item = z.object({
	name: z.string().trim().min(1).max(60),
	quantity: z.number().positive().max(50).default(1),
	unit: z.string().trim().max(12).default(""),
	kcal: z.number().min(0).max(5000),
	protein: z.number().min(0).max(500),
	carbs: z.number().min(0).max(1000),
	fat: z.number().min(0).max(500),
});

const logMeal = defineTool({
	name: "log_meal",
	description:
		"Logs a meal. Pass `text` with what they ate in their words ('2 fried eggs, a paratha and chai') and the app's food list fills in the macros. For foods it doesn't know it returns them as unmatched: call again with `items`, giving your own estimate of each one's macros for the quantity eaten. The slot defaults to the time of day.",
	input: z
		.object({
			text: z.string().trim().max(300).optional(),
			items: z.array(item).max(15).optional().describe("Foods with your own macro estimate."),
			slot: z.enum(SLOTS).optional(),
			day: z.iso.date().optional(),
		})
		.strict()
		.refine((input) => input.text || input.items?.length, "Give text or items."),
	effect: "write",
	label: () => "Logging the meal",
	describe: async (ctx, input) => {
		const items = resolveItems(input);
		const total = sum(items);
		return {
			title: `Log ${SLOT_LABELS[input.slot ?? slotNow(ctx)].toLowerCase()} · ${total.kcal} kcal`,
			detail: `${items.map((each) => each.name).join(", ")} · ${total.protein} g protein`,
		};
	},
	run: async (ctx, input) => {
		const items = resolveItems(input);
		const day = input.day ?? today(ctx);
		const slot = input.slot ?? slotNow(ctx);
		const at =
			day === today(ctx)
				? ctx.now
				: (zonedToDate(
						`${day}T${String(Math.floor(SLOT_TIMES[slot] / 60)).padStart(2, "0")}:${String(SLOT_TIMES[slot] % 60).padStart(2, "0")}`,
						ctx.context.timeZone,
					) ?? ctx.now);
		const meal: Meal = {
			id: newId(),
			day,
			slot,
			items,
			photo: null,
			planned: false,
			recipeId: null,
			at: at.toISOString(),
		};
		await putRecord(ctx.db, ctx.userId, MEALS, meal.id, meal, ctx.now.getTime());
		return {
			result: { logged: mealBrief(meal) },
			cards: [{ kind: "list", title: "Logged", empty: "", items: [mealItem(meal)] }],
			changed: [MEALS],
			undo: [{ collection: MEALS, id: meal.id, previous: null }],
		};
	},
});

/** The meal's items: the app's own matches for `text`, plus the model's estimates in `items`. */
function resolveItems(input: { text?: string; items?: z.infer<typeof item>[] }): FoodItem[] {
	const given: FoodItem[] = (input.items ?? []).map((each) =>
		Object.assign({}, each, { foodId: null }),
	);
	if (!input.text) return given;
	const parsed = parseMealText(input.text);
	const known = new Set(given.map((each) => each.name.toLowerCase()));
	const unmatched = parsed.unmatched.filter((word) => !known.has(word.toLowerCase()));
	if (unmatched.length > 0 && given.length === 0) {
		throw new ToolError(
			`These aren't in the food list: ${unmatched.join(", ")}. Call again with items for them, estimating their macros.`,
			{
				matched: parsed.items.map((each) => each.name),
				unmatched,
			},
		);
	}
	const items = [...parsed.items, ...given];
	if (items.length === 0)
		throw new ToolError("No food recognised. Pass items with estimated macros.");
	return items;
}

const logWater = defineTool({
	name: "log_water",
	description: "Adds water drunk today, in millilitres (a glass is about 250 ml).",
	input: z.object({ ml: z.number().int().min(50).max(5000) }).strict(),
	effect: "write",
	label: () => "Adding water",
	describe: async (_ctx, input) => ({ title: `Add ${input.ml} ml of water`, detail: "Today" }),
	run: async (ctx, input) => {
		const day = today(ctx);
		const before = await getRecord(ctx.db, ctx.userId, WATER, day, parseWater);
		const ml = (before?.ml ?? 0) + input.ml;
		await putRecord(ctx.db, ctx.userId, WATER, day, { id: day, ml }, ctx.now.getTime());
		return {
			result: { todayMl: ml },
			changed: [WATER],
			undo: [{ collection: WATER, id: day, previous: before }],
		};
	},
});

const logWeight = defineTool({
	name: "log_weight",
	description: "Records today's weigh-in in kilograms (convert pounds first).",
	input: z.object({ kg: z.number().min(20).max(400) }).strict(),
	effect: "write",
	label: () => "Recording your weight",
	describe: async (_ctx, input) => ({ title: `Weigh-in: ${input.kg} kg`, detail: "Today" }),
	run: async (ctx, input) => {
		const day = today(ctx);
		const before = await getRecord(ctx.db, ctx.userId, WEIGHTS, day, parseWeighIn);
		const kg = round1(input.kg);
		await putRecord(ctx.db, ctx.userId, WEIGHTS, day, { id: day, kg }, ctx.now.getTime());
		return {
			result: { kg, day },
			changed: [WEIGHTS],
			undo: [{ collection: WEIGHTS, id: day, previous: before }],
		};
	},
});

const deleteMeal = defineTool({
	name: "delete_meal",
	description: "Deletes one logged meal by id (from food_today).",
	input: z.object({ id: z.string().min(1).max(64) }).strict(),
	effect: "risky",
	label: () => "Deleting the meal",
	describe: async (ctx, input) => {
		const meal = await getRecord(ctx.db, ctx.userId, MEALS, input.id, parseMeal);
		if (!meal) throw new ToolError("No meal has that id.");
		return {
			title: `Delete ${SLOT_LABELS[meal.slot].toLowerCase()} on ${meal.day}`,
			detail: meal.items.map((each) => each.name).join(", "),
		};
	},
	run: async (ctx, input) => {
		const meal = await getRecord(ctx.db, ctx.userId, MEALS, input.id, parseMeal);
		if (!meal) throw new ToolError("No meal has that id. Find it with food_today.");
		await putRecord(ctx.db, ctx.userId, MEALS, meal.id, meal, ctx.now.getTime(), true);
		return {
			result: { deleted: mealBrief(meal) },
			changed: [MEALS],
			undo: [{ collection: MEALS, id: meal.id, previous: meal }],
		};
	},
});

export const foodTools = [foodToday, foodWeek, logMeal, logWater, logWeight, deleteMeal];
