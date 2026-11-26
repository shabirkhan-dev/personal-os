import type { ImageSourcePropType } from "react-native";
import type { IconName } from "@/components/icons";
import { listItems, saveItem } from "@/lib/db/collection";
import { applyPlan } from "@/modules/care/data/care-actions";
import {
	careAreas,
	careHabits,
	careProducts,
	careSettings,
	careSteps,
} from "@/modules/care/data/collections";
import { defaultSettings as defaultCareSettings } from "@/modules/care/lib/care-model";
import { CARE_TEMPLATES } from "@/modules/care/lib/care-templates";
import { faithCards, faithSettings, pathProgress } from "@/modules/faith/data/collections";
import {
	saveSettings as saveFaithSettings,
	seedCards,
	startChallenge,
} from "@/modules/faith/data/faith-actions";
import {
	CHALLENGES,
	DEFAULT_TASBIH,
	defaultSettings as defaultFaithSettings,
	PATHS,
	STARTER_CARDS,
} from "@/modules/faith/lib/faith-content";
import { addFromCatalog } from "@/modules/fashion/data/fashion-actions";
import { pieces } from "@/modules/fashion/data/collections";
import { CATALOG as FASHION_CATALOG } from "@/modules/fashion/lib/catalog";
import { CATALOG_IMAGES } from "@/modules/fashion/lib/catalog-images";
import { financeSettings } from "@/modules/finance/data/collections";
import {
	applySuggestedBudget,
	applySuggestedMinimum,
} from "@/modules/finance/data/finance-actions";
import { defaultSettings as defaultFinanceSettings } from "@/modules/finance/lib/finance-model";
import { myRecipes } from "@/modules/food/data/collections";
import { RECIPE_IMAGES } from "@/modules/food/lib/recipe-images";
import { RECIPES, templateRecipeId } from "@/modules/food/lib/recipes";
import { trainingPrograms } from "@/modules/workout/data/collections";
import { TRAINING_PHOTOS } from "@/modules/workout/lib/photos";
import { BUILT_IN_PROGRAMS } from "@/modules/workout/lib/programs/built-in";

/**
 * The template marketplace. Every module starts empty; a pack is a set of ready-made items
 * (recipes, programs, routines, a tasbih sequence…) that the person can look through and add.
 * Adding copies the items into their own data, where they change or delete them like anything
 * they made. Nothing here is ever added on its own.
 */

export type TemplateModule =
	| "food"
	| "training"
	| "care"
	| "faith"
	| "finance"
	| "fashion"
	| "daily";

export const MODULE_LABELS: Record<TemplateModule, string> = {
	food: "Food",
	training: "Training",
	care: "Care",
	faith: "Faith",
	finance: "Finance",
	fashion: "Fashion",
	daily: "Daily life",
};

export type PackItem = {
	id: string;
	title: string;
	subtitle: string;
	photo?: ImageSourcePropType;
	/** Longer lines shown when the item is opened (a recipe's ingredients, a path's lessons). */
	detail?: readonly string[];
};

export type TemplatePack = {
	id: string;
	module: TemplateModule;
	title: string;
	summary: string;
	icon: IconName;
	/** A photo for the pack's card, when it has one. */
	cover?: ImageSourcePropType;
	items: readonly PackItem[];
	/** "pick": choose items one by one; "one": only one at a time (a challenge); "all": one set. */
	choose: "pick" | "one" | "all";
	/** Ids of the items already in the person's data. */
	added: () => Promise<ReadonlySet<string>>;
	add: (ids: readonly string[]) => Promise<void>;
	/** Where to go to see what was added. */
	open: string;
	/** Who shared it, for a template someone sent. */
	author?: string;
};

const first = <T>(list: readonly T[]): T | undefined => list[0];

const recipesPack: TemplatePack = {
	id: "food-everyday-recipes",
	module: "food",
	title: "Everyday Pakistani recipes",
	summary: `${RECIPES.length} home dishes with photos, macros, steps and grocery lists: karahi, pulao, daal, parathas, shakes and more.`,
	icon: "Food",
	cover: RECIPE_IMAGES["chicken-karahi"],
	choose: "pick",
	items: RECIPES.map((recipe) => ({
		id: recipe.id,
		title: recipe.name,
		subtitle: `${recipe.minutes} min · ${recipe.kcal} kcal · ${recipe.protein} g protein`,
		photo: RECIPE_IMAGES[recipe.photo],
		detail: [
			...recipe.ingredients.map((item) => `${item.amount} ${item.name}`.trim()),
			...recipe.steps.map((step, index) => `${index + 1}. ${step.text}`),
		],
	})),
	added: async () => {
		const mine = new Set((await listItems(myRecipes)).map((recipe) => recipe.id));
		return new Set(
			RECIPES.filter((recipe) => mine.has(templateRecipeId(recipe.id))).map((r) => r.id),
		);
	},
	add: async (ids) => {
		await Promise.all(
			RECIPES.filter((recipe) => ids.includes(recipe.id)).map((recipe) =>
				saveItem(myRecipes, { ...recipe, id: templateRecipeId(recipe.id), mine: true }),
			),
		);
	},
	open: "/food/recipes",
};

const programsPack: TemplatePack = {
	id: "training-programs",
	module: "training",
	title: "Training programs",
	summary: `${BUILT_IN_PROGRAMS.length} programs that progress on their own: calisthenics skills, running, boxing, gym and recovery.`,
	icon: "Dumbbell",
	cover: TRAINING_PHOTOS.handstand,
	choose: "pick",
	items: BUILT_IN_PROGRAMS.map((program) => ({
		id: program.id,
		title: program.title,
		subtitle: `${program.weeks} weeks · ${program.level} · ${program.goal}`,
		photo: program.photo ? TRAINING_PHOTOS[program.photo] : undefined,
		detail: [program.summary],
	})),
	added: async () => new Set((await listItems(trainingPrograms)).map((program) => program.id)),
	add: async (ids) => {
		const now = new Date().toISOString();
		await Promise.all(
			BUILT_IN_PROGRAMS.filter((program) => ids.includes(program.id)).map((program) =>
				saveItem(trainingPrograms, { ...program, createdAt: now }),
			),
		);
	},
	open: "/training/programs",
};

const carePack: TemplatePack = {
	id: "care-routines",
	module: "care",
	title: "Care routines",
	summary:
		"Morning and night routines for skin and hair, with how to apply each step, plus daily habits and body areas.",
	icon: "Sun",
	choose: "pick",
	items: CARE_TEMPLATES.map((template) => {
		const plan = template.plan();
		return {
			id: template.id,
			title: template.title,
			subtitle: template.description,
			detail: [
				...plan.steps.map(
					(step) => `${step.routine === "night" ? "Night" : "Morning"} · ${step.name}`,
				),
				...plan.habits.map((habit) => `Habit · ${habit.name}`),
				...plan.areas.map((area) => `Body · ${area.name}`),
			],
		};
	}),
	// Routines merge into the person's own, so none counts as "added" for good.
	added: async () => new Set(),
	add: async (ids) => {
		for (const template of CARE_TEMPLATES.filter((item) => ids.includes(item.id))) {
			// Each plan links to what the previous one put on the shelf.
			// oxlint-disable-next-line eslint/no-await-in-loop
			const [steps, products, habits, areas, settings] = await Promise.all([
				listItems(careSteps),
				listItems(careProducts),
				listItems(careHabits),
				listItems(careAreas),
				listItems(careSettings),
			]);
			// oxlint-disable-next-line eslint/no-await-in-loop
			await applyPlan(
				template.plan(),
				{ steps, products, habits, areas },
				"add",
				first(settings) ?? defaultCareSettings(),
			);
		}
	},
	open: "/",
};

const tasbihPack: TemplatePack = {
	id: "faith-tasbih-classic",
	module: "faith",
	title: "The classic tasbih",
	summary: "SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34, in order, as your tasbih sequence.",
	icon: "Star",
	choose: "all",
	items: DEFAULT_TASBIH.map((phrase) => ({
		id: phrase.id,
		title: phrase.label,
		subtitle: `${phrase.arabic} · ${phrase.target} times`,
	})),
	added: async () => {
		const settings = first(await listItems(faithSettings));
		const have = new Set((settings?.tasbih ?? []).map((phrase) => phrase.id));
		return new Set(
			DEFAULT_TASBIH.filter((phrase) => have.has(phrase.id)).map((phrase) => phrase.id),
		);
	},
	add: async () => {
		const settings = first(await listItems(faithSettings)) ?? defaultFaithSettings();
		await saveFaithSettings({ ...settings, tasbih: [...DEFAULT_TASBIH] });
	},
	open: "/faith/tasbih",
};

const cardsPack: TemplatePack = {
	id: "faith-starter-cards",
	module: "faith",
	title: "Words and duas flashcards",
	summary: `${STARTER_CARDS.length} cards from short surahs and daily duas, reviewed with spaced repetition.`,
	icon: "Layers",
	choose: "all",
	items: STARTER_CARDS.map((card) => ({ id: card.id, title: card.front, subtitle: card.back })),
	added: async () => {
		const have = new Set((await listItems(faithCards)).map((card) => card.id));
		return new Set(STARTER_CARDS.filter((card) => have.has(card.id)).map((card) => card.id));
	},
	add: async () => seedCards(await listItems(faithCards)),
	open: "/faith/flashcards",
};

const pathsPack: TemplatePack = {
	id: "faith-learning-paths",
	module: "faith",
	title: "Learning paths",
	summary:
		"Short lessons, step by step: salah, the short surahs, core beliefs and more. Tick each lesson as you go.",
	icon: "Layers",
	choose: "pick",
	items: PATHS.map((path) => ({
		id: path.id,
		title: path.title,
		subtitle: `${path.lessons.length} lessons · ${path.summary}`,
		detail: path.lessons.map((lesson) => lesson.title),
	})),
	added: async () => new Set((await listItems(pathProgress)).map((item) => item.id)),
	add: async (ids) => {
		const have = new Set((await listItems(pathProgress)).map((item) => item.id));
		await Promise.all(
			ids.filter((id) => !have.has(id)).map((id) => saveItem(pathProgress, { id, done: [] })),
		);
	},
	open: "/faith/grow",
};

const challengesPack: TemplatePack = {
	id: "faith-challenges",
	module: "faith",
	title: "Challenges",
	summary: "A daily goal for a few weeks, ticked off one day at a time. One runs at a time.",
	icon: "Lightning",
	choose: "one",
	items: CHALLENGES.map((challenge) => ({
		id: challenge.title,
		title: challenge.title,
		subtitle: `${challenge.detail} · ${challenge.days} days`,
	})),
	added: async () => new Set(),
	add: async (ids) => {
		const challenge = CHALLENGES.find((item) => item.title === ids[0]);
		if (challenge) await startChallenge(challenge);
	},
	open: "/faith/grow",
};

const budgetPack: TemplatePack = {
	id: "finance-budget-split",
	module: "finance",
	title: "A suggested budget",
	summary:
		"Your monthly spend split into food, bills, transport, care, giving and a buffer, plus the list of what must always be paid.",
	icon: "Wallet",
	choose: "pick",
	items: [
		{ id: "split", title: "Budget split", subtitle: "A limit for each spending line" },
		{
			id: "minimum",
			title: "The minimum list",
			subtitle: "Rent, food and bills that always get paid",
		},
	],
	added: async () => {
		const settings = first(await listItems(financeSettings));
		const out = new Set<string>();
		if (settings && Object.values(settings.limits).some((limit) => limit > 0)) out.add("split");
		if (settings && settings.minimum.length > 0) out.add("minimum");
		return out;
	},
	add: async (ids) => {
		const settings = first(await listItems(financeSettings)) ?? defaultFinanceSettings();
		if (ids.includes("split")) await applySuggestedBudget(settings);
		const after = first(await listItems(financeSettings)) ?? settings;
		if (ids.includes("minimum")) await applySuggestedMinimum(after);
	},
	open: "/finance/budget",
};

const wardrobePack: TemplatePack = {
	id: "fashion-basics",
	module: "fashion",
	title: "Wardrobe basics",
	summary:
		"Tees, shirts, trousers, shoes and scents with photos, to start your wardrobe before you photograph your own.",
	icon: "Shirt",
	cover: CATALOG_IMAGES["white-tee"],
	choose: "pick",
	items: FASHION_CATALOG.map((item) => ({
		id: item.id,
		title: item.name,
		subtitle: `${item.category} · ${item.colour}`,
		photo: CATALOG_IMAGES[item.id],
	})),
	added: async () => {
		const images = new Set((await listItems(pieces)).map((piece) => piece.image));
		return new Set(
			FASHION_CATALOG.filter((item) => images.has(`catalog:${item.id}`)).map((item) => item.id),
		);
	},
	add: async (ids) => addFromCatalog(ids),
	open: "/fashion/wardrobe",
};

export const TEMPLATE_PACKS: readonly TemplatePack[] = [
	recipesPack,
	programsPack,
	carePack,
	tasbihPack,
	cardsPack,
	pathsPack,
	challengesPack,
	budgetPack,
	wardrobePack,
];

export const packById = (id: string) => TEMPLATE_PACKS.find((pack) => pack.id === id);

export function packsFor(module: TemplateModule | null, query = ""): TemplatePack[] {
	const words = query.trim().toLowerCase();
	return TEMPLATE_PACKS.filter(
		(pack) =>
			(!module || pack.module === module) &&
			(!words ||
				pack.title.toLowerCase().includes(words) ||
				pack.summary.toLowerCase().includes(words) ||
				pack.items.some((item) => item.title.toLowerCase().includes(words))),
	);
}
