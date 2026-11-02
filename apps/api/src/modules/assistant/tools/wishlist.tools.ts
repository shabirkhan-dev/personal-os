import type { Card } from "@personal-os/domain/assistant";
import { newId } from "@personal-os/domain/dates";
import {
	amountLeft,
	CATEGORY_LABELS,
	DREAM_CATEGORIES,
	type Dream,
	defaultWishlistSettings,
	inLine,
	monthlyForDreams,
	parseDream,
	parseWishlistSettings,
	roadmap,
	totalToSave,
} from "@personal-os/domain/wishlist";
import * as z from "zod";

import { getRecord, listRecords, putRecord } from "../assistant.records";
import { localClock } from "../assistant.time";
import { defineTool, type ToolContext, ToolError } from "../assistant.tool";

const DREAMS = "wishlist-dreams";
const rupees = (amount: number) => `Rs ${Math.round(amount).toLocaleString("en-US")}`;

async function load(ctx: ToolContext) {
	const now = localClock(ctx.now, ctx.context.timeZone).now;
	const [dreams, settingsRows, financeRows] = await Promise.all([
		listRecords(ctx.db, ctx.userId, DREAMS, parseDream),
		listRecords(ctx.db, ctx.userId, "wishlist-settings", parseWishlistSettings),
		listRecords(ctx.db, ctx.userId, "finance-settings", (raw) =>
			typeof raw === "object" && raw && "monthlyIncome" in raw
				? (raw as { monthlyIncome: unknown })
				: null,
		),
	]);
	const settings = settingsRows[0] ?? defaultWishlistSettings();
	const income = Number(financeRows[0]?.monthlyIncome) || settings.plannedIncome;
	return { now, dreams, settings, monthly: monthlyForDreams(income, settings.saveShare) };
}

function findDream(dreams: readonly Dream[], ref: string): Dream {
	const words = ref.toLowerCase().split(/\s+/).filter(Boolean);
	const matches = dreams.filter(
		(dream) => dream.id === ref || words.every((word) => dream.name.toLowerCase().includes(word)),
	);
	const [only, ...rest] = matches;
	if (only && rest.length === 0) return only;
	throw new ToolError(
		matches.length > 1 ? `More than one dream matches "${ref}".` : `No dream matches "${ref}".`,
		{
			dreams: (matches.length > 1 ? matches : dreams).map((dream) => dream.name),
		},
	);
}

const wishlistView = defineTool({
	name: "wishlist_view",
	description:
		"Their dreams in line: each one's price, what's saved and left, and when it's reachable at their saving rate; plus the total still to save. Use it for 'what am I saving for', 'when can I get the bike'.",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Checking your wishlist",
	run: async (ctx) => {
		const { now, dreams, monthly } = await load(ctx);
		const line = inLine(dreams);
		const stops = roadmap(dreams, monthly, now);
		const when = new Map(stops.map((stop) => [stop.dream.id, stop]));
		const cards: Card[] = [
			{
				kind: "progress",
				title: `Dreams · ${rupees(totalToSave(dreams))} to go`,
				items: line.map((dream) => ({
					label: dream.name,
					used: dream.savedAmount,
					limit: Math.max(1, dream.price),
					text: `${rupees(dream.savedAmount)} of ${rupees(dream.price)}`,
					tone: dream.savedAmount >= dream.price ? "success" : "accent",
				})),
			},
		];
		if (monthly <= 0 && line.length > 0) {
			cards.push({
				kind: "callout",
				tone: "caution",
				title: "No saving rate yet",
				text: "Set your income in Finance or a planned income in Wishlist to see when each dream is reachable.",
			});
		}
		return {
			result: {
				monthlyForDreams: monthly,
				dreams: line.map((dream) => ({
					name: dream.name,
					category: dream.category,
					price: dream.price,
					saved: dream.savedAmount,
					left: amountLeft(dream),
					reachable: when.get(dream.id)?.ready?.toISOString().slice(0, 10) ?? null,
					why: dream.notes || undefined,
				})),
				got: dreams.filter((dream) => dream.status === "got").map((dream) => dream.name),
			},
			cards,
		};
	},
});

const addDream = defineTool({
	name: "add_dream",
	description:
		"Adds a dream to the end of the line, with its price and why they want it (ask why if they didn't say: it makes the wait easier).",
	input: z
		.object({
			name: z.string().trim().min(1).max(80),
			price: z.number().positive().max(1_000_000_000),
			category: z.enum(DREAM_CATEGORIES),
			why: z.string().trim().min(2).max(400),
			targetDate: z.iso.date().optional(),
		})
		.strict(),
	effect: "write",
	label: (input) => `Adding ${input.name}`,
	describe: async (_ctx, input) => ({
		title: `Add dream: ${input.name}`,
		detail: `${rupees(input.price)} · ${CATEGORY_LABELS[input.category]}`,
	}),
	run: async (ctx, input) => {
		const { dreams } = await load(ctx);
		const last = inLine(dreams).at(-1);
		const dream: Dream = {
			id: newId(),
			name: input.name,
			price: Math.round(input.price),
			savedAmount: 0,
			contributions: [],
			category: input.category,
			priority: (last?.priority ?? 0) + 1,
			status: "want",
			photo: null,
			targetDate: input.targetDate ?? null,
			notes: input.why,
			paysForItself: false,
			checklist: [],
			specs: [],
			priceLow: null,
			priceHigh: null,
			addedAt: ctx.now.toISOString(),
			gotAt: null,
		};
		await putRecord(ctx.db, ctx.userId, DREAMS, dream.id, dream, ctx.now.getTime());
		return {
			result: { added: dream.name, place: dream.priority },
			changed: [DREAMS],
			undo: [{ collection: DREAMS, id: dream.id, previous: null }],
		};
	},
});

const markGot = defineTool({
	name: "mark_dream_got",
	description: "Marks a dream as got: it leaves the line and is celebrated in Wishlist.",
	input: z.object({ dream: z.string().trim().min(1).max(80) }).strict(),
	effect: "write",
	label: () => "Marking it got",
	describe: async (ctx, input) => {
		const { dreams } = await load(ctx);
		return { title: `Got ${findDream(dreams, input.dream).name}`, detail: "It leaves the line" };
	},
	run: async (ctx, input) => {
		const { dreams } = await load(ctx);
		const dream = findDream(dreams, input.dream);
		const before = await getRecord(ctx.db, ctx.userId, DREAMS, dream.id, parseDream);
		await putRecord(
			ctx.db,
			ctx.userId,
			DREAMS,
			dream.id,
			{ ...dream, status: "got", gotAt: ctx.now.toISOString() },
			ctx.now.getTime(),
		);
		return {
			result: { got: dream.name },
			changed: [DREAMS],
			undo: [{ collection: DREAMS, id: dream.id, previous: before }],
		};
	},
});

export const wishlistTools = [wishlistView, addDream, markGot];
