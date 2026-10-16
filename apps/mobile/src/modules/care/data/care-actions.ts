import { listItems, removeItem, saveItem } from "@/lib/db/collection";
import { dayKey, newId } from "@/lib/day";
import { deleteJson, readJson } from "@/lib/storage/json-file";
import { asArray, asNumber, asString, isRecord } from "@/lib/storage/parse";
import { buildRoutine, photoFor } from "../lib/catalog";
import { emptyDay, finishRoutine, toggleStep } from "../lib/care-math";
import {
	type CareDay,
	type CareSettings,
	type CheckIn,
	type Concern,
	defaultSettings,
	type Habit,
	type Product,
	type Routine,
	type SkinType,
	type Step,
} from "../lib/care-model";
import {
	careCheckIns,
	careDays,
	careHabits,
	careProducts,
	careSettings,
	careSteps,
} from "./collections";

/** Every Care write. Each saves to the record store, which refreshes the screens and syncs. */

export function saveSettings(settings: CareSettings): Promise<void> {
	return saveItem(careSettings, settings);
}

/** The empty Home's "Build my routine": steps, a starter shelf and daily habits. */
export async function setUp(
	settings: CareSettings,
	concerns: readonly Concern[],
	skin: readonly SkinType[],
	existing: { steps: readonly Step[]; products: readonly Product[]; habits: readonly Habit[] },
	now = new Date(),
): Promise<void> {
	const built = buildRoutine(concerns, skin, dayKey(now), settings.nailDay);
	const keep = new Set(existing.products.map((product) => product.name.toLowerCase()));
	await Promise.all([
		...existing.steps.map((step) => removeItem(careSteps, step.id)),
		...existing.habits.map((habit) => removeItem(careHabits, habit.id)),
	]);
	await Promise.all([
		...built.steps.map((step) => saveItem(careSteps, step)),
		...built.habits.map((habit) => saveItem(careHabits, habit)),
		...built.products
			.filter((product) => !keep.has(product.name.toLowerCase()))
			.map((product) => saveItem(careProducts, product)),
	]);
	await saveItem(careSettings, {
		...settings,
		setUp: true,
		concerns: [...concerns],
		skin: [...skin],
	});
}

export function saveDay(day: CareDay): Promise<void> {
	return saveItem(careDays, day);
}

export function tick(
	record: CareDay | null,
	day: string,
	step: Step,
	routineSteps: readonly Step[],
	now = new Date(),
): Promise<CareDay> {
	const next = toggleStep(record ?? emptyDay(day), step, routineSteps, now);
	return saveItem(careDays, next).then(() => next);
}

export function finish(
	record: CareDay | null,
	day: string,
	routineSteps: readonly Step[],
	now = new Date(),
): Promise<CareDay> {
	const next = finishRoutine(record ?? emptyDay(day), routineSteps, now);
	return saveItem(careDays, next).then(() => next);
}

export function skip(record: CareDay | null, day: string, routine: Routine): Promise<void> {
	const base = record ?? emptyDay(day);
	return saveItem(careDays, { ...base, skipped: [...new Set([...base.skipped, routine])] });
}

export function toggleHabit(record: CareDay | null, day: string, habitId: string): Promise<void> {
	const base = record ?? emptyDay(day);
	const habits = base.habits.includes(habitId)
		? base.habits.filter((id) => id !== habitId)
		: [...base.habits, habitId];
	return saveItem(careDays, { ...base, habits });
}

export function saveStep(step: Omit<Step, "id"> & { id?: string }): Promise<void> {
	return saveItem(careSteps, { ...step, id: step.id ?? newId() });
}

export function deleteStep(step: Step): Promise<void> {
	return removeItem(careSteps, step.id);
}

export function saveHabit(habit: Omit<Habit, "id"> & { id?: string }): Promise<void> {
	return saveItem(careHabits, { ...habit, id: habit.id ?? newId() });
}

export function deleteHabit(habit: Habit): Promise<void> {
	return removeItem(careHabits, habit.id);
}

export async function saveProduct(
	input: Omit<Product, "id" | "photo"> & { id?: string; photo?: string | null },
): Promise<Product> {
	const product: Product = {
		...input,
		id: input.id ?? newId(),
		name: input.name.trim(),
		photo: input.photo ?? photoFor(input.name),
	};
	await saveItem(careProducts, product);
	return product;
}

/** A new bottle: the supply starts again today. */
export function restock(product: Product, now = new Date()): Promise<void> {
	return saveItem(careProducts, { ...product, openedOn: dayKey(now) });
}

export function deleteProduct(product: Product): Promise<void> {
	return removeItem(careProducts, product.id);
}

export function saveCheckIn(checkIn: Omit<CheckIn, "at">, now = new Date()): Promise<void> {
	return saveItem(careCheckIns, { ...checkIn, at: now.toISOString() });
}

// --- the first Skincare version's file ------------------------------------------------------------

/**
 * Moves what the first Skincare version kept in its "skincare" file (its routines, products and
 * which steps were ticked) into the record store, once, then removes the file. Its skin photos
 * stay where they are on the phone; check-ins are now words and numbers only.
 */
export async function migrateOldSkincare(): Promise<boolean> {
	const raw = await readJson("skincare");
	if (!isRecord(raw)) return false;
	if ((await listItems(careSteps)).length > 0) {
		await deleteJson("skincare");
		return false;
	}
	const routines = isRecord(raw.routines) ? raw.routines : {};
	const steps: Step[] = (["morning", "night"] as const).flatMap((routine) =>
		asArray(routines[routine], (item) => {
			if (!isRecord(item)) return null;
			const name = asString(item.name, "").trim();
			const id = asString(item.id, "");
			return name && id ? { id, name, detail: asString(item.detail, "") } : null;
		}).map((step, order) => ({
			id: step.id,
			routine,
			area: "face" as const,
			name: step.name,
			detail: step.detail,
			productId: null,
			minutes: 1,
			days: [],
			short: "",
			order,
		})),
	);
	const products: Product[] = asArray(raw.products, (item) => {
		if (!isRecord(item)) return null;
		const name = asString(item.name, "").trim();
		const openedOn = asString(item.startedAt, "");
		if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(openedOn)) return null;
		return {
			id: asString(item.id, "") || newId(),
			name,
			area: "face" as const,
			photo: photoFor(name),
			openedOn,
			lastsDays: Math.max(7, Math.round(asNumber(item.lastsWeeks, 8) * 7)),
			price: 0,
		};
	});
	const days: CareDay[] = isRecord(raw.completions)
		? Object.entries(raw.completions).flatMap(([day, record]) => {
				if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isRecord(record)) return [];
				const ticked: Record<string, string> = {};
				for (const part of [record.morning, record.night]) {
					if (!isRecord(part)) continue;
					for (const [id, at] of Object.entries(part)) if (typeof at === "string") ticked[id] = at;
				}
				const finished = asArray(record.finished, (value) =>
					value === "morning" || value === "night" ? value : null,
				);
				return [{ id: day, steps: ticked, habits: [], skipped: [], finished }];
			})
		: [];
	await Promise.all([
		...steps.map((step) => saveItem(careSteps, step)),
		...products.map((product) => saveItem(careProducts, product)),
		...days.map((day) => saveItem(careDays, day)),
	]);
	if (steps.length > 0) {
		const settings = (await listItems(careSettings))[0];
		if (!settings) {
			await saveItem(careSettings, { ...defaultSettings(), setUp: true });
		}
	}
	await deleteJson("skincare");
	return true;
}
