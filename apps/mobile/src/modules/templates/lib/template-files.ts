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
import {
	addCards,
	saveSettings as saveFaithSettings,
	startChallenge,
} from "@/modules/faith/data/faith-actions";
import {
	CARD_KINDS,
	type CardKind,
	defaultSettings as defaultFaithSettings,
} from "@/modules/faith/lib/faith-content";
import { financeSettings } from "@/modules/finance/data/collections";
import { saveSettings as saveFinanceSettings } from "@/modules/finance/data/finance-actions";
import {
	CATEGORIES,
	defaultSettings as defaultFinanceSettings,
} from "@/modules/finance/lib/finance-model";
import { myRecipes } from "@/modules/food/data/collections";
import { parseMyRecipe } from "@/modules/food/lib/my-recipes";
import { trainingExercises, trainingPrograms } from "@/modules/workout/data/collections";
import {
	allExercises,
	type CatalogExercise,
	parseSavedExercise,
} from "@/modules/workout/lib/exercise-guide";
import { parseProgram, type ProgramDef } from "@/modules/workout/lib/programs/program-model";
import type { PackItem, TemplateModule, TemplatePack } from "./template-pack";

/**
 * Template files (made with any AI, or shared by people) as packs to preview and add. Every item
 * goes through its module's own parser first: a file is outside data, so anything malformed is
 * dropped rather than saved.
 */

const MODULE_OF: Record<TemplateKind, TemplateModule> = {
	recipes: "food",
	programs: "training",
	exercises: "training",
	"care-routine": "care",
	tasbih: "faith",
	flashcards: "faith",
	challenge: "faith",
	budget: "finance",
	minimum: "daily",
};

const OPEN_OF: Record<TemplateKind, string> = {
	recipes: "/food/recipes",
	programs: "/training/programs",
	exercises: "/training/exercises",
	"care-routine": "/care/routine",
	tasbih: "/faith/tasbih",
	flashcards: "/faith/flashcards",
	challenge: "/faith/grow",
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
			// A photo on someone else's phone means nothing here; a web link does.
			const image =
				typeof item.image === "string" && item.image.startsWith("https://") ? item.image : null;
			return parseMyRecipe({ ...item, id: `mine-${file.id}-${index}`.slice(0, 60), image });
		})
		.filter((recipe) => recipe !== null);
}

const slug = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 40);

/**
 * Exercises from a file, keyed by the id the file used. One the person already has (same name)
 * is reused; the rest get fresh ids so they never clash with theirs.
 */
function exercisesFrom(raws: readonly unknown[], fileId: string): Map<string, CatalogExercise> {
	const byName = new Map(allExercises().map((exercise) => [exercise.name.toLowerCase(), exercise]));
	const out = new Map<string, CatalogExercise>();
	raws.forEach((raw, index) => {
		if (!isObject(raw)) return;
		const key = typeof raw.id === "string" && raw.id ? raw.id : `x${index}`;
		const mine =
			typeof raw.name === "string" ? byName.get(raw.name.trim().toLowerCase()) : undefined;
		const exercise =
			mine ??
			parseSavedExercise({ ...raw, id: `ex-${slug(fileId)}-${slug(key) || index}`.slice(0, 60) });
		if (exercise) out.set(key, exercise);
	});
	return out;
}

/** Programs, each with the exercises it brings (items point at them by the file's ids). */
function programsOf(file: TemplateFile): { program: ProgramDef; exercises: CatalogExercise[] }[] {
	return file.items
		.map((item, index) => {
			if (!isObject(item)) return null;
			const exercises = exercisesFrom(list(item.exercises), `${file.id}-${index}`);
			const mine = new Set(allExercises().map((exercise) => exercise.id));
			const sessions = list(item.sessions).map((session) =>
				isObject(session)
					? Object.assign({}, session, {
							items: list(session.items).map((entry) =>
								isObject(entry) && typeof entry.exercise === "string"
									? Object.assign({}, entry, {
											exercise: exercises.get(entry.exercise)?.id ?? entry.exercise,
										})
									: entry,
							),
						})
					: session,
			);
			const known = new Set([...mine, ...[...exercises.values()].map((exercise) => exercise.id)]);
			const program = parseProgram(
				{ ...item, sessions, id: `${file.id}-${index}`.slice(0, 60), source: "custom" },
				(id) => known.has(id),
			);
			if (!program) return null;
			const used = new Set(
				program.sessions.flatMap((session) => session.items.map((entry) => entry.exercise)),
			);
			return {
				program,
				exercises: [...exercises.values()].filter(
					(exercise) => used.has(exercise.id) && !mine.has(exercise.id),
				),
			};
		})
		.filter((entry) => entry !== null);
}

function ownExercisesOf(file: TemplateFile): CatalogExercise[] {
	const mine = new Set(allExercises().map((exercise) => exercise.id));
	return [...exercisesFrom(file.items, file.id).values()].filter(
		(exercise) => !mine.has(exercise.id),
	);
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
	return file.items
		.map((item, index) => {
			if (!isObject(item) || typeof item.label !== "string" || !item.label.trim()) return null;
			const target = typeof item.target === "number" ? Math.round(item.target) : 33;
			return {
				id: `${slug(item.label) || "phrase"}-${index}`,
				label: item.label.trim().slice(0, 40),
				arabic: typeof item.arabic === "string" ? item.arabic.trim().slice(0, 120) : "",
				target: Math.min(1000, Math.max(1, target)),
			};
		})
		.filter((phrase) => phrase !== null)
		.slice(0, 12);
}

const text = (value: unknown, max: number) =>
	typeof value === "string" ? value.trim().slice(0, max) : "";

function cardsOf(file: TemplateFile) {
	return file.items
		.map((item) => {
			if (!isObject(item)) return null;
			const front = text(item.front, 200);
			const back = text(item.back, 300);
			if (!front || !back) return null;
			const kind: CardKind = (CARD_KINDS as readonly string[]).includes(String(item.kind))
				? (item.kind as CardKind)
				: "word";
			return {
				kind,
				front,
				prompt: text(item.prompt, 120) || "What does it mean?",
				back,
				source: text(item.source, 80),
			};
		})
		.filter((card) => card !== null)
		.slice(0, 100);
}

function challengeOf(file: TemplateFile) {
	const raw = isObject(file.items[0]) ? file.items[0] : {};
	const title = text(raw.title, 60);
	if (!title) return null;
	const days = typeof raw.days === "number" ? Math.round(raw.days) : 21;
	return {
		title,
		detail: text(raw.detail, 80) || "Every day",
		days: Math.min(120, Math.max(1, days)),
	};
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
				detail: [
					...recipe.ingredients.map((item) => `${item.amount} ${item.name}`.trim()),
					...recipe.steps.map((step, index) => `${index + 1}. ${step.text}`),
				],
			}));
		case "programs":
			return programsOf(file).map(({ program, exercises }) => ({
				id: program.id,
				title: program.title,
				subtitle: `${program.weeks} weeks · ${program.level} · ${program.sessions.length} sessions${exercises.length ? ` · ${exercises.length} new exercises` : ""}`,
				detail: [
					...(program.summary ? [program.summary] : []),
					...program.sessions.map(
						(session) => `${session.title}: ${session.items.length} exercises`,
					),
				],
			}));
		case "exercises":
			return ownExercisesOf(file).map((exercise) => ({
				id: exercise.id,
				title: exercise.name,
				subtitle: `${exercise.pattern} · level ${exercise.level}${exercise.equipment.length ? ` · ${exercise.equipment.join(", ")}` : ""}`,
				detail: exercise.cues.filter(Boolean),
			}));
		case "flashcards":
			return cardsOf(file).map((card, index) => ({
				id: `card-${index}`,
				title: card.front,
				subtitle: card.back,
			}));
		case "challenge": {
			const challenge = challengeOf(file);
			return challenge
				? [
						{
							id: "challenge",
							title: challenge.title,
							subtitle: `${challenge.detail} · ${challenge.days} days`,
						},
					]
				: [];
		}
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
			const picked = programsOf(file).filter(({ program }) => ids.includes(program.id));
			// The exercises first, so the programs find them.
			await Promise.all(
				picked.flatMap(({ exercises }) =>
					exercises.map((exercise) => saveItem(trainingExercises, exercise)),
				),
			);
			await Promise.all(
				picked.map(({ program }) => saveItem(trainingPrograms, { ...program, createdAt: now })),
			);
			return;
		}
		case "exercises": {
			const picked = ownExercisesOf(file).filter((exercise) => ids.includes(exercise.id));
			await Promise.all(picked.map((exercise) => saveItem(trainingExercises, exercise)));
			return;
		}
		case "flashcards": {
			const cards = cardsOf(file);
			await addCards(cards.filter((_, index) => ids.includes(`card-${index}`)));
			return;
		}
		case "challenge": {
			const challenge = challengeOf(file);
			if (challenge) await startChallenge(challenge);
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

const ICON_OF: Record<TemplateKind, TemplatePack["icon"]> = {
	recipes: "Food",
	programs: "Dumbbell",
	exercises: "Dumbbell",
	"care-routine": "Drop",
	tasbih: "Star",
	flashcards: "Layers",
	challenge: "Lightning",
	budget: "Wallet",
	minimum: "List",
};

/** Kinds where the person picks items, rather than adding the whole set. */
const PICK: ReadonlySet<TemplateKind> = new Set(["recipes", "programs", "exercises", "flashcards"]);

/** A template file (made with AI, pasted, or shared) as a pack to preview and add. */
export function packFromFile(file: TemplateFile): TemplatePack {
	const items = previewOf(file);
	const pick = PICK.has(file.kind);
	return {
		id: file.id,
		module: MODULE_OF[file.kind],
		title: file.title,
		summary: file.summary || (file.author ? `Shared by ${file.author}.` : `${items.length} items.`),
		icon: ICON_OF[file.kind],
		items,
		choose: pick ? "pick" : "all",
		// A file is added as copies; adding again adds another copy.
		added: async () => new Set<string>(),
		add: (ids) => install(file, pick ? ids : items.map((item) => item.id)),
		open: OPEN_OF[file.kind],
		...(file.author ? { author: file.author } : {}),
	};
}

/** Reads a file someone shared; null when it isn't a usable template. */
export function readTemplateText(source: string): ReturnType<typeof parseTemplateFile> {
	try {
		return parseTemplateFile(JSON.parse(source));
	} catch {
		return {
			ok: false,
			reason: "That isn't a Personal OS template (it isn't valid JSON). Paste only the AI's JSON.",
		};
	}
}
