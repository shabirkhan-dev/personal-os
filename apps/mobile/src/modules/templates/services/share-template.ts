import {
	makeTemplateFile,
	type TemplateFile,
	type TemplateKind,
	templateFileName,
} from "@personal-os/domain/templates";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import type { BodyArea, Habit, Product, Step } from "@/modules/care/lib/care-model";
import type { OwnItem } from "@/modules/daily/lib/daily-model";
import type { TasbihPhrase } from "@/modules/faith/lib/faith-content";
import type { FinanceSettings } from "@/modules/finance/lib/finance-model";
import type { Recipe } from "@/modules/food/lib/recipes";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import type { ProgramDef } from "@/modules/workout/lib/programs/program-model";
import { readTemplateText } from "../lib/template-files";

/**
 * Sharing the person's own things as a template file (`.posx.json`) through the share sheet
 * (WhatsApp, email, Drive…), and opening one someone sent. Only what the template needs goes in:
 * no ids, no history, no photos from the phone.
 */

const author = () => useOnboardingStore.getState().name.trim();

async function share(file: TemplateFile): Promise<void> {
	const target = new File(Paths.cache, templateFileName(file));
	if (target.exists) target.delete();
	target.create({ intermediates: true });
	await target.write(JSON.stringify(file, null, 1));
	if (Platform.OS === "web" || !(await Sharing.isAvailableAsync())) {
		throw new Error("Sharing isn't available here");
	}
	await Sharing.shareAsync(target.uri, {
		mimeType: "application/json",
		dialogTitle: `Share "${file.title}"`,
		UTI: "public.json",
	});
}

function make(kind: TemplateKind, title: string, summary: string, items: unknown[]): TemplateFile {
	return makeTemplateFile({ kind, title, summary, author: author(), items });
}

export function shareRecipe(recipe: Recipe): Promise<void> {
	const { id: _id, image, mine: _mine, ...rest } = recipe;
	return share(
		make(
			"recipes",
			recipe.name,
			recipe.note || `${recipe.minutes} min · ${recipe.serves} servings`,
			[{ ...rest, image: image?.startsWith("https://") ? image : null }],
		),
	);
}

export function shareProgram(program: ProgramDef): Promise<void> {
	const { id: _id, createdAt: _createdAt, ...rest } = program;
	return share(make("programs", program.title, program.summary || program.goal, [rest]));
}

export function shareCareRoutine(care: {
	steps: readonly Step[];
	products: readonly Product[];
	habits: readonly Habit[];
	areas: readonly BodyArea[];
}): Promise<void> {
	const nameOf = new Map(care.products.map((product) => [product.id, product.name]));
	const used = new Set(care.steps.map((step) => step.productId).filter(Boolean));
	const plan = {
		steps: care.steps.map(({ id: _id, photos: _photos, productId, ...step }) =>
			Object.assign(step, { productId: productId ? (nameOf.get(productId) ?? null) : null }),
		),
		products: care.products
			.filter((product) => used.has(product.id))
			.map(({ id: _id, photo: _photo, ...product }) => Object.assign(product, { photo: null })),
		habits: care.habits.map(({ id: _id, ...habit }) => habit),
		areas: care.areas.map(({ id: _id, ...area }) => area),
	};
	const mine = author();
	return share(
		make(
			"care-routine",
			mine ? `${mine}'s routine` : "My care routine",
			`${care.steps.length} steps${care.habits.length ? ` and ${care.habits.length} habits` : ""}, with how to apply each.`,
			[plan],
		),
	);
}

export function shareTasbih(phrases: readonly TasbihPhrase[]): Promise<void> {
	return share(
		make(
			"tasbih",
			"My tasbih",
			phrases.map((phrase) => `${phrase.label} ${phrase.target}`).join(", "),
			[...phrases],
		),
	);
}

export function shareBudget(settings: FinanceSettings): Promise<void> {
	const total = Object.values(settings.limits).reduce((sum, value) => sum + value, 0);
	return share(
		make(
			"budget",
			`A Rs ${Math.round(total / 1000)}k budget`,
			"Limits for each spending line and what's always paid.",
			[{ limits: settings.limits, minimum: settings.minimum }],
		),
	);
}

export function shareMinimum(own: readonly OwnItem[]): Promise<void> {
	return share(
		make(
			"minimum",
			"My minimum day",
			own.map((item) => item.label).join(", "),
			own.map((item) => ({ label: item.label })),
		),
	);
}

/** Lets the person pick a template file someone sent. Null when they cancel. */
export async function pickTemplate(): Promise<ReturnType<typeof readTemplateText> | null> {
	const picked = await File.pickFileAsync({
		mimeTypes: Platform.OS === "ios" ? ["public.json"] : ["application/json", "text/plain", "*/*"],
	});
	if (picked.canceled) return null;
	return readTemplateText(await picked.result.text());
}
