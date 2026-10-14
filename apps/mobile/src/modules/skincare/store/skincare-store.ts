import { createDocumentStore } from "@/lib/storage/document-store";
import { asArray, asNumber, asString, isRecord, oneOf } from "@/lib/storage/parse";
import {
	type CheckIn,
	type DayRecord,
	DEFAULT_ROUTINES,
	HYDRATION_LEVELS,
	type Product,
	REDNESS_LEVELS,
	ROUTINE_KINDS,
	type RoutineKind,
	type SkincareDoc,
	type Step,
	type StepsDone,
} from "../lib/skincare-types";

const initial: SkincareDoc = {
	routines: DEFAULT_ROUTINES,
	completions: {},
	checkIns: [],
	products: [],
};

function parseStep(raw: unknown): Step | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const name = asString(raw.name, "").trim();
	if (!id || !name) return null;
	return { id, name, detail: asString(raw.detail, "") };
}

function parseStepsDone(raw: unknown): StepsDone {
	const out: StepsDone = {};
	if (!isRecord(raw)) return out;
	for (const [id, at] of Object.entries(raw)) if (typeof at === "string") out[id] = at;
	return out;
}

function parseDay(raw: unknown): DayRecord {
	const record = isRecord(raw) ? raw : {};
	const finished = asArray<RoutineKind>(record.finished, (kind) =>
		typeof kind === "string" && (ROUTINE_KINDS as readonly string[]).includes(kind)
			? (kind as RoutineKind)
			: null,
	);
	return {
		morning: parseStepsDone(record.morning),
		night: parseStepsDone(record.night),
		finished,
	};
}

function parseCheckIn(raw: unknown): CheckIn | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const day = asString(raw.dayKey, "");
	if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
	const photoUri = asString(raw.photoUri, "");
	return {
		id,
		dayKey: day,
		hydration: oneOf(raw.hydration, HYDRATION_LEVELS, "ok"),
		redness: oneOf(raw.redness, REDNESS_LEVELS, "low"),
		breakouts: Math.max(0, Math.round(asNumber(raw.breakouts, 0))),
		...(photoUri ? { photoUri } : {}),
	};
}

function parseProduct(raw: unknown): Product | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const name = asString(raw.name, "").trim();
	const startedAt = asString(raw.startedAt, "");
	if (!id || !name || !/^\d{4}-\d{2}-\d{2}$/.test(startedAt)) return null;
	return { id, name, startedAt, lastsWeeks: Math.max(1, asNumber(raw.lastsWeeks, 8)) };
}

export function parseSkincare(raw: unknown): SkincareDoc {
	if (!isRecord(raw)) return initial;
	const routines = isRecord(raw.routines) ? raw.routines : {};
	const completions: Record<string, DayRecord> = {};
	if (isRecord(raw.completions)) {
		for (const [key, day] of Object.entries(raw.completions)) completions[key] = parseDay(day);
	}
	return {
		routines: {
			morning: Array.isArray(routines.morning)
				? asArray(routines.morning, parseStep)
				: DEFAULT_ROUTINES.morning,
			night: Array.isArray(routines.night)
				? asArray(routines.night, parseStep)
				: DEFAULT_ROUTINES.night,
		},
		completions,
		checkIns: asArray(raw.checkIns, parseCheckIn),
		products: asArray(raw.products, parseProduct),
	};
}

export const useSkincareStore = createDocumentStore<SkincareDoc>(
	"skincare",
	initial,
	parseSkincare,
);
