import type { RoutinePlan } from "../data/care-actions";
import { buildRoutine } from "./catalog";
import type { Area, Concern, SkinType } from "./care-model";

/**
 * Ready-made starting points. Care starts empty; a template is only added when the person picks
 * one, and every step stays theirs to change. Each template is a plan: steps with how-to
 * instructions, the products they use, and any habits or body areas.
 */

export type CareTemplate = {
	id: string;
	title: string;
	description: string;
	plan: () => RoutinePlan;
};

/** A routine template from the routine builder, optionally only some areas, without habits. */
function routine(
	concerns: Concern[],
	skin: SkinType[],
	areas: Area[] = ["face", "hair", "body"],
): () => RoutinePlan {
	return () => {
		const built = buildRoutine(concerns, skin, new Date().toISOString().slice(0, 10));
		const steps = built.steps.filter((step) => areas.includes(step.area));
		const used = new Set(steps.map((step) => step.productId));
		const products = built.products.filter((product) => used.has(product.id));
		const nameOf = new Map(products.map((product) => [product.id, product.name]));
		return {
			steps: steps.map(({ id: _id, order: _order, ...step }) =>
				// A plan points at products by name; applying it links them on the shelf.
				Object.assign(step, {
					productId: step.productId ? (nameOf.get(step.productId) ?? null) : null,
				}),
			),
			products: products.map(({ id: _id, ...product }) => product),
			habits: [],
			areas: [],
		};
	};
}

export const CARE_TEMPLATES: readonly CareTemplate[] = [
	{
		id: "basics",
		title: "The basics",
		description: "Cleanser, moisturiser and sunscreen, plus a weekly nail day. Five minutes a day.",
		plan: routine([], ["normal-combination"], ["face", "body"]),
	},
	{
		id: "spots-tan",
		title: "Dark spots and tan",
		description: "The basics with a niacinamide serum, body lotion and a weekly scrub.",
		plan: routine(["dark-spots", "tan"], ["normal-combination"]),
	},
	{
		id: "dry-sensitive",
		title: "Dry or sensitive skin",
		description: "Gentle wash, ceramide cream morning and night, lotion after the shower.",
		plan: routine(["dryness"], ["sensitive"]),
	},
	{
		id: "oily-pores",
		title: "Oily skin and pores",
		description: "A light moisturiser and a niacinamide serum for oil and pores.",
		plan: routine(["pores"], ["oily"], ["face"]),
	},
	{
		id: "dandruff",
		title: "Dandruff",
		description:
			"An anti-dandruff wash twice a week, left on long enough to work, and gentle combing.",
		plan: routine(["dandruff"], [], ["hair"]),
	},
	{
		id: "hair",
		title: "Thicker hair",
		description: "A rosemary scalp oil twice a week and gentle combing on damp hair.",
		plan: routine(["hair-density"], [], ["hair"]),
	},
	{
		id: "habits",
		title: "Daily habits",
		description: "Brush twice, floss before bed and drink your water (it ticks itself from Food).",
		plan: () => ({
			steps: [],
			products: [],
			habits: [
				{ name: "Brush morning and night", detail: "2 min each", link: null },
				{ name: "Floss", detail: "Before bed", link: null },
				{ name: "Drink your water", detail: "Shared with Food", link: "water" },
			],
			areas: [],
		}),
	},
	{
		id: "body-areas",
		title: "Body areas",
		description: "Neck and arms, back, elbows and shins, hands and nails, each with what helps.",
		plan: () => ({
			steps: [],
			products: [],
			habits: [],
			areas: [
				{
					name: "Neck and arms",
					issue: "Tan and dark spots",
					care: "SPF daily · lotion at night",
					metrics: ["tan", "dark-spots"],
				},
				{
					name: "Back",
					issue: "Dark spots",
					care: "Body lotion · loose cotton in summer",
					metrics: ["dark-spots"],
				},
				{
					name: "Elbows and shins",
					issue: "Dry patches",
					care: "Thicker lotion after shower",
					metrics: ["face-dryness"],
				},
				{
					name: "Hands and nails",
					issue: "Trim weekly",
					care: "File, cuticles, cream",
					metrics: ["nails"],
				},
			],
		}),
	},
];

export function templateById(id: string): CareTemplate | undefined {
	return CARE_TEMPLATES.find((template) => template.id === id);
}
