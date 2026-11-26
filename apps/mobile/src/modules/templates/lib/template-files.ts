import {
	parseTemplateFile,
	type TemplateFile,
	type TemplateKind,
} from "@personal-os/domain/templates";
import { listItems, saveItem } from "@/lib/db/collection";
import { applyPlan, type RoutinePlan } from "@/modules/care/data/care-actions";
import {
	careAreas,
	careHabits,
	careProducts,
	careSettings,
	careSteps,
} from "@/modules/care/data/collections";
import {
	defaultSettings as defaultCareSettings,
	parseBodyArea,
	parseHabit,
	parseProduct,
	parseStep,
} from "@/modules/care/lib/care-model";
import { dailySettings } from "@/modules/daily/data/collections";
import {
	defaultSettings as defaultDailySettings,
	type OwnId,
} from "@/modules/daily/lib/daily-model";
import { faithSettings } from "@/modules/faith/data/collections";
import { saveSettings as saveFaithSettings } from "@/modules/faith/data/faith-actions";
import {
	defaultSettings as defaultFaithSettings,
	parseSettings as parseFaithSettings,
} from "@/modules/faith/lib/faith-content";
import { financeSettings } from "@/modules/finance/data/collections";
import { saveSettings as saveFinanceSettings } from "@/modules/finance/data/finance-actions";
import {
	CATEGORIES,
	defaultSettings as defaultFinanceSettings,
} from "@/modules/finance/lib/finance-model";
import { myRecipes } from "@/modules/food/data/collections";
import { parseMyRecipe } from "@/modules/food/lib/my-recipes";
import { RECIPE_IMAGES } from "@/modules/food/lib/recipe-images";
import { trainingPrograms } from "@/modules/workout/data/collections";
import { parseProgram } from "@/modules/workout/lib/programs/program-model";
import type { PackItem, TemplateModule, TemplatePack } from "./packs";

/**
 * Template files (shared by people, or offered by the server) as packs the marketplace can show
 * and add. Every item goes through its module's own parser first: a file is outside data, so
 * anything malformed is dropped rather than saved.
 */

const MODULE_OF: Record<TemplateKind, TemplateModule> = {
	recipes: "food",
	programs: "training",
	"care-routine": "care",
	tasbih: "faith",
	budget: "finance",
	minimum: "daily",
};

const ICON_OF = {
	recipes: "Food",
	programs: "Dumbbell",
	"care-routine": "Sun",
	tasbih: "Star",
	budget: "Wallet",
	minimum: "List",
} as const;

const OPEN_OF: Record<TemplateKind, string> = {
	recipes: "/food/recipes",
	programs: "/training/programs",
	"care-routine": "/",
	tasbih: "/faith/tasbih",
	budget: "/finance/budget",
	minimum: "/daily/minimum",
};

const rand = () => Math.random().toString(36).slice(2, 8);
const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const money = (value: unknown) =>
	typeof value === "number" && Number.isFinite(value)
		? Math.max(0, Math.min(1e9, Math.round(value)))
		: 0;

function recipesOf(file: TemplateFile) {
	return file.items
		.map((item, index) => {
			if (!isObject(item)) return null;
			// A photo on someone else's phone means nothing here; a bundled one or a web link does.
			const image =
				typeof item.image === "string" && item.image.startsWith("https://") ? item.image : null;
			const photo = typeof item.photo === "string" && RECIPE_IMAGES[item.photo] ? item.photo : "";
			return parseMyRecipe({ ...item, id: `mine-${file.id}-${index}`.slice(0, 60), image, photo });
		})
		.filter((recipe) => recipe !== null);
}

function programsOf(file: TemplateFile) {
	return file.items
		.map((item, index) =>
			isObject(item) ? parseProgram({ ...item, id: `${file.id}-${index}`.slice(0, 60) }) : null,
		)
		.filter((program) => program !== null);
}

function planOf(file: TemplateFile): RoutinePlan {
	const raw = isObject(file.items[0]) ? file.items[0] : {};
	return {
		steps: list(raw.steps)
			.map((step, order) => parseStep(isObject(step) ? { ...step, id: "draft", order } : null))
			.filter((step) => step !== null)
			.map(({ id: _id, order: _order, ...step }) => step)
			.slice(0, 20),
		products: list(raw.products)
			.map((product) => parseProduct(isObject(product) ? { ...product, id: "draft" } : null))
			.filter((product) => product !== null)
			.map(({ id: _id, ...product }) => product)
			.slice(0, 20),
		habits: list(raw.habits)
			.map((habit, order) => parseHabit(isObject(habit) ? { ...habit, id: "draft", order } : null))
			.filter((habit) => habit !== null)
			.map(({ id: _id, order: _order, ...habit }) => habit)
			.slice(0, 10),
		areas: list(raw.areas)
			.map((area, order) => parseBodyArea(isObject(area) ? { ...area, id: "draft", order } : null))
			.filter((area) => area !== null)
			.map(({ id: _id, order: _order, ...area }) => area)
			.slice(0, 10),
	};
}

function phrasesOf(file: TemplateFile) {
	return parseFaithSettings({ tasbih: file.items })?.tasbih ?? [];
}

function budgetOf(file: TemplateFile) {
	const raw = isObject(file.items[0]) ? file.items[0] : {};
	const limits = isObject(raw.limits) ? raw.limits : {};
	return {
		limits: Object.fromEntries(CATEGORIES.map((category) => [category, money(limits[category])])),
		minimum: (Array.isArray(raw.minimum) ? raw.minimum : [])
			.map((item) =>
				isObject(item) && typeof item.label === "string" && item.label.trim()
					? { label: item.label.trim().slice(0, 40), amount: money(item.amount) }
					: null,
			)
			.filter((item) => item !== null)
			.slice(0, 12),
	};
}

function minimumOf(file: TemplateFile): string[] {
	return file.items
		.map((item) =>
			isObject(item) && typeof item.label === "string" ? item.label.trim().slice(0, 60) : "",
		)
		.filter(Boolean)
		.slice(0, 12);
}

/** What the pack shows, item by item, before anything is added. */
function previewOf(file: TemplateFile): PackItem[] {
	switch (file.kind) {
		case "recipes":
			return recipesOf(file).map((recipe) => ({
				id: recipe.id,
				title: recipe.name,
				subtitle: [
					`${recipe.minutes} min`,
					recipe.kcal ? `${recipe.kcal} kcal` : "",
					recipe.protein ? `${recipe.protein} g protein` : "",
				]
					.filter(Boolean)
					.join(" · "),
				photo: recipe.photo ? RECIPE_IMAGES[recipe.photo] : undefined,
				detail: [
					...recipe.ingredients.map((item) => `${item.amount} ${item.name}`.trim()),
					...recipe.steps.map((step, index) => `${index + 1}. ${step.text}`),
				],
			}));
		case "programs":
			return programsOf(file).map((program) => ({
				id: program.id,
				title: program.title,
				subtitle: `${program.weeks} weeks · ${program.level}${program.goal ? ` · ${program.goal}` : ""}`,
				detail: program.summary ? [program.summary] : undefined,
			}));
		case "care-routine": {
			const plan = planOf(file);
			return [
				...plan.steps.map((step, index) => ({
					id: `step-${index}`,
					title: step.name,
					subtitle: `${step.routine === "night" ? "Night" : "Morning"}${step.detail ? ` · ${step.detail}` : ""}`,
					detail: step.howTo ? [step.howTo] : undefined,
				})),
				...plan.habits.map((habit, index) => ({
					id: `habit-${index}`,
					title: habit.name,
					subtitle: `Habit${habit.detail ? ` · ${habit.detail}` : ""}`,
				})),
			];
		}
		case "tasbih":
			return phrasesOf(file).map((phrase) => ({
				id: phrase.id,
				title: phrase.label,
				subtitle: `${phrase.arabic} · ${phrase.target} times`,
			}));
		case "budget": {
			const budget = budgetOf(file);
			return [
				...CATEGORIES.filter((category) => (budget.limits[category] ?? 0) > 0).map((category) => ({
					id: `line-${category}`,
					title: category.charAt(0).toUpperCase() + category.slice(1),
					subtitle: `Rs ${(budget.limits[category] ?? 0).toLocaleString("en-US")} a month`,
				})),
				...budget.minimum.map((item, index) => ({
					id: `min-${index}`,
					title: `Always paid: ${item.label}`,
					subtitle: `Rs ${item.amount.toLocaleString("en-US")}`,
				})),
			];
		}
		case "minimum":
			return minimumOf(file).map((label, index) => ({
				id: `own-${index}`,
				title: label,
				subtitle: "For your minimum day",
			}));
	}
}

/** Adds the picked items (or the whole file, for the kinds that come as one set). */
async function install(file: TemplateFile, ids: readonly string[]): Promise<void> {
	switch (file.kind) {
		case "recipes": {
			const picked = recipesOf(file).filter((recipe) => ids.includes(recipe.id));
			await Promise.all(picked.map((recipe) => saveItem(myRecipes, recipe)));
			return;
		}
		case "programs": {
			const now = new Date().toISOString();
			const picked = programsOf(file).filter((program) => ids.includes(program.id));
			await Promise.all(
				picked.map((program) => saveItem(trainingPrograms, { ...program, createdAt: now })),
			);
			return;
		}
		case "care-routine": {
			const [steps, products, habits, areas, settings] = await Promise.all([
				listItems(careSteps),
				listItems(careProducts),
				listItems(careHabits),
				listItems(careAreas),
				listItems(careSettings),
			]);
			await applyPlan(
				planOf(file),
				{ steps, products, habits, areas },
				"add",
				settings[0] ?? defaultCareSettings(),
			);
			return;
		}
		case "tasbih": {
			const settings = (await listItems(faithSettings))[0] ?? defaultFaithSettings();
			await saveFaithSettings({ ...settings, tasbih: phrasesOf(file) });
			return;
		}
		case "budget": {
			const settings = (await listItems(financeSettings))[0] ?? defaultFinanceSettings();
			const budget = budgetOf(file);
			await saveFinanceSettings({
				...settings,
				limits: { ...settings.limits, ...budget.limits },
				minimum: budget.minimum.length ? budget.minimum : settings.minimum,
			});
			return;
		}
		case "minimum": {
			const settings = (await listItems(dailySettings))[0] ?? defaultDailySettings();
			const fresh = minimumOf(file)
				.filter((label) => !settings.own.some((item) => item.label === label))
				.map((label) => ({ id: `c-${Date.now().toString(36)}${rand()}` as OwnId, label }));
			const own = [...settings.own, ...fresh].slice(0, 12);
			await saveItem(dailySettings, {
				...settings,
				setUp: true,
				own,
				minimum: [...settings.minimum, ...fresh.map((item) => item.id)].slice(0, 7),
			});
			return;
		}
	}
}

export type PackSource = "server" | "shared";

/** A template file as a marketplace pack. */
export function packFromFile(file: TemplateFile, source: PackSource): TemplatePack {
	const items = previewOf(file);
	const pick = file.kind === "recipes" || file.kind === "programs";
	return {
		id: file.id,
		module: MODULE_OF[file.kind],
		title: file.title,
		summary:
			file.summary ||
			(source === "shared" && file.author ? `Shared by ${file.author}.` : `${items.length} items.`),
		icon: ICON_OF[file.kind],
		items,
		choose: pick ? "pick" : "all",
		// Shared and server packs are added as copies; adding again adds another copy.
		added: async () => new Set<string>(),
		add: (ids) => install(file, pick ? ids : items.map((item) => item.id)),
		open: OPEN_OF[file.kind],
		...(source === "shared" && file.author ? { author: file.author } : {}),
	};
}

/** Reads a file someone shared; null when it isn't a usable template. */
export function readTemplateText(text: string): ReturnType<typeof parseTemplateFile> {
	try {
		return parseTemplateFile(JSON.parse(text));
	} catch {
		return { ok: false, reason: "This file isn't a Personal OS template (it isn't valid JSON)." };
	}
}
