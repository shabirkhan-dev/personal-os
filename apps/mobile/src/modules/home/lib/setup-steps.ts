import type { ModuleId } from "@/modules/onboarding/lib/options";

/**
 * The first-run checklist: each module the person picked starts empty, and offers three ways in:
 * add your own, let AI draft it, or start from a template. Nothing is added until they choose.
 */

/** `href` "home" opens the module's own Home, where its setup lives. */
export type SetupAction = { label: string; href: string };

export type SetupStep = {
	module: ModuleId;
	title: string;
	/** What "started" means for this module, in their words. */
	hint: string;
	own: SetupAction;
	ai: SetupAction | null;
	template: SetupAction | null;
};

const STEPS: Record<ModuleId, Omit<SetupStep, "module">> = {
	"daily-life": {
		title: "Set your minimum day",
		hint: "The few things you do even on a bad day.",
		own: { label: "My own", href: "/daily/minimum" },
		ai: { label: "Plan with AI", href: "/daily/plan" },
		template: { label: "Template", href: "/templates?module=daily" },
	},
	food: {
		title: "Pick your meals or add a recipe",
		hint: "Meals you log each day, recipes you cook.",
		own: { label: "My own", href: "/food/recipe-edit" },
		ai: { label: "Plan with AI", href: "/food/plan" },
		template: { label: "Template", href: "/templates?module=food" },
	},
	workout: {
		title: "Make a training program",
		hint: "The sessions you'll do each week.",
		own: { label: "My own", href: "/training/program-builder" },
		ai: { label: "Design with AI", href: "/training/program-builder?ai=1" },
		template: { label: "Template", href: "/templates?module=training" },
	},
	skincare: {
		title: "Build your Care routine",
		hint: "Morning and night steps, with how to do each.",
		own: { label: "My own", href: "/care/step" },
		ai: { label: "Design with AI", href: "/care/design" },
		template: { label: "Template", href: "/templates?module=care" },
	},
	faith: {
		title: "Set up prayer times",
		hint: "Your city and method, so reminders are right.",
		own: { label: "Set up", href: "home" },
		ai: null,
		template: { label: "Template", href: "/templates?module=faith" },
	},
	finance: {
		title: "Make a budget",
		hint: "What a month costs, line by line.",
		own: { label: "My own", href: "/finance/budget" },
		ai: { label: "Design with AI", href: "/finance/budget" },
		template: { label: "Template", href: "/templates?module=finance" },
	},
	fashion: {
		title: "Add a few pieces you wear",
		hint: "Your wardrobe, for outfit ideas.",
		own: { label: "Add a piece", href: "/fashion/add" },
		ai: null,
		template: { label: "Template", href: "/templates?module=fashion" },
	},
	career: {
		title: "Track a job application",
		hint: "Where you applied and what comes next.",
		own: { label: "Add one", href: "/career/applications" },
		ai: null,
		template: null,
	},
	health: {
		title: "Add a medicine or supplement",
		hint: "With times, so reminders never miss.",
		own: { label: "Add one", href: "/health/medicines" },
		ai: null,
		template: null,
	},
	wishlist: {
		title: "Add something you're saving for",
		hint: "A dream, its price, and how far along you are.",
		own: { label: "Add one", href: "/wishlist/add" },
		ai: null,
		template: null,
	},
};

/** The checklist for the person's modules, in the order they picked them. */
export function setupSteps(modules: readonly ModuleId[]): SetupStep[] {
	return modules.map((module) => ({ module, ...STEPS[module] }));
}

/** How many of `steps` are started, given which modules have something in them. */
export function setupProgress(
	steps: readonly SetupStep[],
	started: ReadonlySet<ModuleId>,
): { done: number; total: number; next: SetupStep | null } {
	const left = steps.filter((step) => !started.has(step.module));
	return { done: steps.length - left.length, total: steps.length, next: left[0] ?? null };
}
