import type { Card } from "@personal-os/domain/assistant";
import { dayKey, newId } from "@personal-os/domain/dates";
import {
	CATEGORIES,
	CATEGORY_LABELS,
	COLOURS,
	colourHeadline,
	colourStory,
	costPerWear,
	idlePieces,
	type Piece,
	parsePiece,
	parseWear,
	parseWish,
	type Wear,
	type Wish,
	wornCount,
} from "@personal-os/domain/fashion";
import * as z from "zod";

import { getRecord, listRecords, putRecord } from "../assistant.records";
import { localClock } from "../assistant.time";
import { defineTool, type ToolContext, ToolError } from "../assistant.tool";

const WEARS = "fashion-wears";
const WISHES = "fashion-wishes";
const rupees = (amount: number) => `Rs ${Math.round(amount).toLocaleString("en-US")}`;

async function load(ctx: ToolContext) {
	const now = localClock(ctx.now, ctx.context.timeZone).now;
	const [pieces, wears, wishes] = await Promise.all([
		listRecords(ctx.db, ctx.userId, "fashion-pieces", parsePiece),
		listRecords(ctx.db, ctx.userId, WEARS, parseWear),
		listRecords(ctx.db, ctx.userId, WISHES, parseWish),
	]);
	return { now, today: dayKey(now), pieces, wears, wishes };
}

function findPieces(pieces: readonly Piece[], names: readonly string[]): Piece[] {
	return names.map((name) => {
		const words = name.toLowerCase().split(/\s+/).filter(Boolean);
		const matches = pieces.filter((piece) =>
			words.every((word) =>
				`${piece.name} ${piece.colour} ${piece.category}`.toLowerCase().includes(word),
			),
		);
		const [only, ...rest] = matches;
		if (only && rest.length === 0) return only;
		throw new ToolError(
			matches.length > 1
				? `More than one piece matches "${name}". Ask which.`
				: `No piece matches "${name}".`,
			{
				pieces: (matches.length > 1 ? matches : pieces).slice(0, 25).map((piece) => piece.name),
			},
		);
	});
}

const wardrobe = defineTool({
	name: "wardrobe_overview",
	description:
		"The wardrobe: pieces per kind, the colours it leans on, the most and least worn, pieces idle for three weeks, today's outfit if logged, and the wish list. Use it for 'what should I wear more', 'what do I own', 'what's on my wish list'.",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Looking through your wardrobe",
	run: async (ctx) => {
		const { now, today, pieces, wears, wishes } = await load(ctx);
		if (pieces.length === 0) {
			return {
				result: { pieces: 0 },
				cards: [{ kind: "link", label: "Add your wardrobe", link: { screen: "fashion" } } as Card],
			};
		}
		const story = colourStory(pieces);
		const idle = idlePieces(pieces, wears, now);
		const worn = pieces
			.map((piece) => ({ piece, count: wornCount(piece.id, wears) }))
			.toSorted((a, b) => b.count - a.count);
		const todays = wears.find((wear) => wear.id === today);
		const cards: Card[] = [
			{
				kind: "chart",
				title: `${pieces.length} pieces`,
				style: "bars",
				unit: "",
				points: CATEGORIES.map((category) => ({
					label: CATEGORY_LABELS[category],
					value: pieces.filter((piece) => piece.category === category).length,
				}))
					.filter((point) => point.value > 0)
					.map((point) => Object.assign({}, point, { display: String(point.value) })),
				note: colourHeadline(story),
			},
		];
		if (idle.length > 0) {
			cards.push({
				kind: "list",
				title: "Not worn in three weeks",
				empty: "",
				items: idle.slice(0, 6).map((piece) => ({
					id: piece.id,
					title: piece.name,
					subtitle: CATEGORY_LABELS[piece.category],
					link: { screen: "fashion" },
				})),
			});
		}
		return {
			result: {
				pieces: pieces.length,
				byKind: Object.fromEntries(
					CATEGORIES.map((category) => [
						category,
						pieces.filter((piece) => piece.category === category).length,
					]),
				),
				colours: story.slice(0, 5).map((share) => ({ colour: share.colour, pieces: share.count })),
				mostWorn: worn.slice(0, 3).map(({ piece, count }) => ({
					name: piece.name,
					worn: count,
					costPerWear: costPerWear(piece, wears),
				})),
				idle: idle.map((piece) => piece.name),
				today: todays
					? {
							look: todays.look,
							pieces: todays.pieceIds.map(
								(id) => pieces.find((piece) => piece.id === id)?.name ?? id,
							),
						}
					: null,
				wishes: wishes.map((wish) => ({
					name: wish.name,
					price: wish.price,
					why: wish.reason || undefined,
				})),
			},
			cards,
		};
	},
});

const logOutfit = defineTool({
	name: "log_outfit",
	description:
		"Logs what they wore today, by the pieces' names ('navy oxford', 'grey chinos'). Logging again replaces today's.",
	input: z
		.object({
			pieces: z.array(z.string().trim().min(1).max(60)).min(1).max(8),
			look: z
				.string()
				.trim()
				.max(60)
				.default("")
				.describe("A name for the look: 'Office', 'Friday dinner'."),
		})
		.strict(),
	effect: "write",
	label: () => "Logging your outfit",
	describe: async (ctx, input) => {
		const { pieces } = await load(ctx);
		return {
			title: "Log today's outfit",
			detail: findPieces(pieces, input.pieces)
				.map((piece) => piece.name)
				.join(", "),
		};
	},
	run: async (ctx, input) => {
		const { today, pieces } = await load(ctx);
		const chosen = findPieces(pieces, input.pieces);
		const before = await getRecord(ctx.db, ctx.userId, WEARS, today, parseWear);
		const wear: Wear = {
			id: today,
			look: input.look,
			pieceIds: chosen.map((piece) => piece.id),
			at: ctx.now.toISOString(),
		};
		await putRecord(ctx.db, ctx.userId, WEARS, today, wear, ctx.now.getTime());
		return {
			result: { logged: chosen.map((piece) => piece.name) },
			changed: [WEARS],
			undo: [{ collection: WEARS, id: today, previous: before }],
		};
	},
});

const addWish = defineTool({
	name: "add_fashion_wish",
	description: "Adds a piece they want to buy to the fashion wish list, with why they want it.",
	input: z
		.object({
			name: z.string().trim().min(1).max(60),
			category: z.enum(CATEGORIES),
			colour: z.enum(COLOURS).default("other"),
			price: z.number().positive().max(10_000_000).optional(),
			why: z.string().trim().max(120).default(""),
		})
		.strict(),
	effect: "write",
	label: (input) => `Adding ${input.name}`,
	describe: async (_ctx, input) => ({
		title: `Wish: ${input.name}`,
		detail: [CATEGORY_LABELS[input.category], input.price ? rupees(input.price) : null, input.why]
			.filter(Boolean)
			.join(" · "),
	}),
	run: async (ctx, input) => {
		const wish: Wish = {
			id: newId(),
			name: input.name,
			category: input.category,
			colour: input.colour,
			price: input.price ?? null,
			tag: "someday",
			reason: input.why,
			unlock: "",
			image: null,
			url: "",
			createdAt: ctx.now.toISOString(),
		};
		await putRecord(ctx.db, ctx.userId, WISHES, wish.id, wish, ctx.now.getTime());
		return {
			result: { added: wish.name },
			changed: [WISHES],
			undo: [{ collection: WISHES, id: wish.id, previous: null }],
		};
	},
});

export const fashionTools = [wardrobe, logOutfit, addWish];
