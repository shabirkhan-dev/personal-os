import type { Card, ListItem } from "@personal-os/domain/assistant";
import {
	AREAS,
	type CareDay,
	careDate,
	currentRoutine,
	defaultSettings,
	emptyDay,
	finishRoutine,
	latestCheckIn,
	METRIC_LABELS,
	METRICS,
	type Metric,
	metricsFor,
	monthlyCost,
	parseCheckIn,
	parseDay,
	parseHabit,
	parseProduct,
	parseSettings,
	parseStep,
	type Product,
	ROUTINES,
	reorderSoon,
	type Routine,
	runningLow,
	type Step,
	stepsOn,
	streak,
	trend,
} from "@personal-os/domain/care";
import { dayKey, newId } from "@personal-os/domain/dates";
import * as z from "zod";

import { getRecord, listRecords, putRecord } from "../assistant.records";
import { localClock } from "../assistant.time";
import { defineTool, type ToolContext, ToolError } from "../assistant.tool";

const DAYS = "care-days";
const PRODUCTS = "care-products";
const CHECK_INS = "care-checkins";

const ROUTINE_LABEL: Record<Routine, string> = { morning: "Morning", night: "Night" };
const rupees = (amount: number) => `Rs ${Math.round(amount).toLocaleString("en-US")}`;

/** Care on the person's clock: the open day (night runs until 04:00) and its routine. */
async function load(ctx: ToolContext) {
	const now = localClock(ctx.now, ctx.context.timeZone).now;
	const [settingsRows, steps, habits, products, days, checkIns] = await Promise.all([
		listRecords(ctx.db, ctx.userId, "care-settings", parseSettings),
		listRecords(ctx.db, ctx.userId, "care-steps", parseStep),
		listRecords(ctx.db, ctx.userId, "care-habits", parseHabit),
		listRecords(ctx.db, ctx.userId, PRODUCTS, parseProduct),
		listRecords(ctx.db, ctx.userId, DAYS, parseDay),
		listRecords(ctx.db, ctx.userId, CHECK_INS, parseCheckIn),
	]);
	const day = dayKey(careDate(now));
	return {
		now,
		day,
		routine: currentRoutine(now),
		settings: settingsRows[0] ?? defaultSettings(),
		steps,
		habits: habits.toSorted((a, b) => a.order - b.order),
		products,
		days,
		record: days.find((each) => each.id === day) ?? emptyDay(day),
		checkIns,
	};
}

/** Finds steps or habits by words in their names; unknown names come back for the model. */
function pick<T extends { id: string; name: string }>(
	all: readonly T[],
	names: readonly string[],
	kind: string,
): T[] {
	return names.map((name) => {
		const words = name.toLowerCase().split(/\s+/).filter(Boolean);
		const found = all.find((each) => words.every((word) => each.name.toLowerCase().includes(word)));
		if (!found)
			throw new ToolError(`No ${kind} called "${name}".`, {
				[`${kind}s`]: all.map((each) => each.name),
			});
		return found;
	});
}

const careToday = defineTool({
	name: "care_today",
	description:
		"Today's care: the morning and night routines with which steps are done, the small habits, the streak, and products running low. The night counts until 04:00. Call it for 'did I do my routine', 'what's left tonight', 'what do I need to buy'.",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Checking your routine",
	run: async (ctx) => {
		const { now, day, routine, steps, habits, products, days, record } = await load(ctx);
		if (steps.length === 0) {
			return {
				result: { setUp: false, note: "No routine yet. Suggest setting up Care in the app." },
				cards: [{ kind: "link", label: "Set up Care", link: { screen: "care" } } as Card],
			};
		}
		const routines = ROUTINES.map((each) => {
			const list = stepsOn(steps, each, day);
			return {
				routine: each,
				steps: list,
				done: list.filter((step) => record.steps[step.id]).length,
			};
		});
		const current = routines.find((each) => each.routine === routine);
		const left = (current?.steps ?? []).filter((step) => !record.steps[step.id]);
		const low = reorderSoon(products, now);
		const cards: Card[] = [
			{
				kind: "progress",
				title: `Today · ${streak(days, now)}-day streak`,
				items: [
					...routines.map((each) => ({
						label: ROUTINE_LABEL[each.routine],
						used: each.done,
						limit: Math.max(1, each.steps.length),
						text: record.skipped.includes(each.routine)
							? "Skipped"
							: `${each.done} of ${each.steps.length}`,
						tone: (each.done === each.steps.length && each.steps.length > 0
							? "success"
							: "accent") as "success" | "accent",
					})),
					...(habits.length > 0
						? [
								{
									label: "Habits",
									used: record.habits.length,
									limit: habits.length,
									text: `${record.habits.length} of ${habits.length}`,
									tone: "accent" as const,
								},
							]
						: []),
				],
			},
		];
		if (left.length > 0) {
			cards.push({
				kind: "list",
				title: `${ROUTINE_LABEL[routine]} · still to do`,
				empty: "",
				items: left.map((step): ListItem => ({
					id: step.id,
					title: step.name,
					subtitle: step.detail || undefined,
					value: step.minutes ? `${step.minutes} min` : undefined,
					link: { screen: "care" },
				})),
			});
		}
		if (low.products.length > 0) {
			cards.push({
				kind: "list",
				title: `Reorder soon · ${rupees(low.total)}`,
				empty: "",
				items: low.products.map((product) => ({
					id: product.id,
					title: product.name,
					subtitle: `${product.left.label} left`,
					value: rupees(product.price),
					tone: product.left.daysLeft <= 3 ? "danger" : "caution",
					link: { screen: "care-shelf" },
				})),
			});
		}
		return {
			result: {
				day,
				nowRoutine: routine,
				routines: routines.map((each) => ({
					routine: each.routine,
					done: each.done,
					total: each.steps.length,
					skipped: record.skipped.includes(each.routine),
					steps: each.steps.map((step) => ({
						name: step.name,
						done: Boolean(record.steps[step.id]),
					})),
				})),
				habits: habits.map((habit) => ({
					name: habit.name,
					done: record.habits.includes(habit.id),
				})),
				streak: streak(days, now),
				runningLow: low.products.map((product) => ({
					name: product.name,
					daysLeft: product.left.daysLeft,
				})),
			},
			cards,
		};
	},
});

const careShelf = defineTool({
	name: "care_shelf",
	description:
		"Every product on the shelf with how long it has left and its price, and what the shelf costs a month.",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Checking your shelf",
	run: async (ctx) => {
		const { now, products } = await load(ctx);
		const low = runningLow(products, now);
		const lasting = products.filter((product) => product.lastsDays <= 0);
		return {
			result: {
				monthlyCost: monthlyCost(products),
				products: [
					...low.map((product) => ({
						name: product.name,
						area: product.area,
						daysLeft: product.left.daysLeft,
						price: product.price,
					})),
					...lasting.map((product) => ({ name: product.name, area: product.area, lasts: true })),
				],
			},
			cards: [
				{
					kind: "metric",
					label: "Shelf",
					value: `${rupees(monthlyCost(products))} a month`,
					detail: `${products.length} products`,
					link: { screen: "care-shelf" },
				},
				{
					kind: "progress",
					title: "Left in each",
					items: low.map((product) => ({
						label: product.name,
						used: product.left.daysLeft,
						limit: product.lastsDays,
						text: product.left.label,
						tone: product.left.daysLeft <= 14 ? "caution" : "success",
					})),
				},
			],
		};
	},
});

const careProgress = defineTool({
	name: "care_progress",
	description:
		"How skin and hair are trending from the weekly check-ins (1 fine to 5 bad per thing they watch: dark spots, dandruff, hair fall…). Use it for 'is my skin getting better', 'how's my hair fall'.",
	input: z
		.object({
			metric: z
				.enum(METRICS)
				.optional()
				.describe("One thing to chart; all of them in brief when omitted."),
		})
		.strict(),
	effect: "read",
	label: () => "Looking at your check-ins",
	run: async (ctx, input) => {
		const { settings, checkIns } = await load(ctx);
		const latest = latestCheckIn(checkIns);
		if (!latest) return { result: { checkIns: 0, note: "No check-ins yet." }, cards: [] };
		const metrics: Metric[] = input.metric ? [input.metric] : metricsFor(settings);
		const series = metrics.map((metric) => ({ metric, points: trend(checkIns, metric) }));
		const cards: Card[] = series
			.filter((each) => each.points.length > 0)
			.slice(0, input.metric ? 1 : 3)
			.map((each) => ({
				kind: "chart",
				title: `${METRIC_LABELS[each.metric]} · lower is better`,
				style: "columns",
				unit: "",
				points: each.points.map((point) => ({
					label: new Date(`${point.day}T12:00:00Z`).toLocaleDateString("en-GB", {
						day: "numeric",
						month: "short",
						timeZone: "UTC",
					}),
					value: point.value,
					display: `${point.value} of 5`,
					tone: point.value <= 2 ? "success" : point.value === 3 ? "accent" : "caution",
				})),
			}));
		return {
			result: {
				latest: { day: latest.id, ratings: latest.ratings, notes: latest.notes },
				trends: series.map((each) => ({ metric: each.metric, values: each.points })),
			},
			cards,
		};
	},
});

/** The open day as stored, so ticks build on what the phone already saved. */
async function currentDay(ctx: ToolContext, day: string): Promise<CareDay> {
	return (await getRecord(ctx.db, ctx.userId, DAYS, day, parseDay)) ?? emptyDay(day);
}

const tickCare = defineTool({
	name: "tick_care",
	description:
		"Marks care done: a whole routine ('did my morning routine'), some of its steps by name ('sunscreen'), or habits ('floss'). The night counts until 04:00.",
	input: z
		.object({
			routine: z.enum(ROUTINES).optional().describe("Tick every step of this routine today."),
			steps: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
			habits: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
		})
		.strict()
		.refine(
			(input) => input.routine || input.steps?.length || input.habits?.length,
			"Name a routine, steps or habits.",
		),
	effect: "write",
	label: () => "Ticking your care",
	describe: async (ctx, input) => {
		const { steps, habits } = await load(ctx);
		const parts = [
			input.routine ? `${ROUTINE_LABEL[input.routine]} routine` : null,
			...pick(steps, input.steps ?? [], "step").map((step) => step.name),
			...pick(habits, input.habits ?? [], "habit").map((habit) => habit.name),
		].filter(Boolean);
		return { title: "Mark done", detail: parts.join(" · ") };
	},
	run: async (ctx, input) => {
		const { day, steps, habits } = await load(ctx);
		const before = await getRecord(ctx.db, ctx.userId, DAYS, day, parseDay);
		let record = await currentDay(ctx, day);
		const stamp = ctx.now.toISOString();
		if (input.routine) record = finishRoutine(record, stepsOn(steps, input.routine, day), ctx.now);
		const named = pick(steps, input.steps ?? [], "step");
		const ticked = { ...record.steps };
		for (const step of named) ticked[step.id] ??= stamp;
		const finished = new Set(record.finished);
		for (const routine of ROUTINES) {
			const list = stepsOn(steps, routine, day);
			if (list.length > 0 && list.every((step: Step) => ticked[step.id])) finished.add(routine);
		}
		record = {
			...record,
			steps: ticked,
			finished: [...finished],
			habits: [
				...new Set([
					...record.habits,
					...pick(habits, input.habits ?? [], "habit").map((habit) => habit.id),
				]),
			],
		};
		await putRecord(ctx.db, ctx.userId, DAYS, day, record, ctx.now.getTime());
		return {
			result: {
				day,
				finished: record.finished,
				stepsDone: Object.keys(record.steps).length,
				habitsDone: record.habits.length,
			},
			changed: [DAYS],
			undo: [{ collection: DAYS, id: day, previous: before }],
		};
	},
});

const restock = defineTool({
	name: "restock_product",
	description: "Records a new bottle or tube of a shelf product, so its supply counts from today.",
	input: z.object({ product: z.string().trim().min(1).max(60) }).strict(),
	effect: "write",
	label: () => "Restocking",
	describe: async (ctx, input) => {
		const { products } = await load(ctx);
		const [product] = pick(products, [input.product], "product");
		return { title: `Restock ${product?.name}`, detail: "A new one opened today" };
	},
	run: async (ctx, input) => {
		const { now, products } = await load(ctx);
		const [product] = pick(products, [input.product], "product") as [Product];
		await putRecord(
			ctx.db,
			ctx.userId,
			PRODUCTS,
			product.id,
			{ ...product, openedOn: dayKey(now) },
			ctx.now.getTime(),
		);
		return {
			result: { restocked: product.name },
			changed: [PRODUCTS],
			undo: [{ collection: PRODUCTS, id: product.id, previous: product }],
		};
	},
});

const addProduct = defineTool({
	name: "add_product",
	description: "Adds a product to the shelf with how long one lasts and its price, opened today.",
	input: z
		.object({
			name: z.string().trim().min(1).max(60),
			area: z.enum(AREAS),
			lastsDays: z.number().int().min(0).max(730).describe("0 for tools that last (a comb)."),
			price: z.number().min(0).max(1_000_000),
		})
		.strict(),
	effect: "write",
	label: (input) => `Adding ${input.name}`,
	describe: async (_ctx, input) => ({
		title: `Add ${input.name}`,
		detail: `${input.area} · ${input.lastsDays ? `lasts ${input.lastsDays} days` : "lasts"} · ${rupees(input.price)}`,
	}),
	run: async (ctx, input) => {
		const { now } = await load(ctx);
		const product: Product = {
			id: newId(),
			name: input.name,
			area: input.area,
			photo: null,
			openedOn: dayKey(now),
			lastsDays: input.lastsDays,
			price: input.price,
		};
		await putRecord(ctx.db, ctx.userId, PRODUCTS, product.id, product, ctx.now.getTime());
		return {
			result: { added: product.name },
			changed: [PRODUCTS],
			undo: [{ collection: PRODUCTS, id: product.id, previous: null }],
		};
	},
});

const saveCheckIn = defineTool({
	name: "save_check_in",
	description:
		"Saves this week's mirror check-in: a rating from 1 (fine) to 5 (bad) for each thing they watch, with optional words. Ask for any rating they didn't give; never guess one.",
	input: z
		.object({
			ratings: z.partialRecord(z.enum(METRICS), z.number().int().min(1).max(5)),
			notes: z.partialRecord(z.enum(METRICS), z.string().trim().max(120)).optional(),
		})
		.strict(),
	effect: "write",
	label: () => "Saving your check-in",
	describe: async (_ctx, input) => ({
		title: "Save check-in",
		detail: Object.entries(input.ratings)
			.map(([metric, value]) => `${METRIC_LABELS[metric as Metric]} ${value}`)
			.join(" · "),
	}),
	run: async (ctx, input) => {
		const { now } = await load(ctx);
		const id = dayKey(now);
		const before = await getRecord(ctx.db, ctx.userId, CHECK_INS, id, parseCheckIn);
		const checkIn = {
			id,
			ratings: input.ratings,
			notes: input.notes ?? {},
			at: ctx.now.toISOString(),
		};
		await putRecord(ctx.db, ctx.userId, CHECK_INS, id, checkIn, ctx.now.getTime());
		return {
			result: { saved: id },
			changed: [CHECK_INS],
			undo: [{ collection: CHECK_INS, id, previous: before }],
		};
	},
});

export const careTools = [
	careToday,
	careShelf,
	careProgress,
	tickCare,
	restock,
	addProduct,
	saveCheckIn,
];
