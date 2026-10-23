import { createDocumentStore } from "@/lib/storage/document-store";
import { asArray, asNumber, asString, isRecord } from "@/lib/storage/parse";
import { parseTemplate, type Template } from "../lib/library";
import type { SetLog } from "../lib/training-model";

/** The session running now: which exercise and set, the sets done, and the rest timer. Kept in a
 * file so it survives the app closing; not synced. */
export type LiveSession = {
	template: string;
	startedAtMs: number;
	exercise: number;
	set: number;
	sets: SetLog[];
	restUntilMs: number | null;
	pausedAtMs: number | null;
	pausedMs: number;
	/** Program sessions as they were when started. */
	snapshot: Template | null;
};

function parseLive(raw: unknown): LiveSession | null {
	if (!isRecord(raw)) return null;
	const template = asString(raw.template, "");
	const startedAtMs = asNumber(raw.startedAtMs, 0);
	if (!template || startedAtMs <= 0) return null;
	const pausedAt = asNumber(raw.pausedAtMs, 0);
	const rest = asNumber(raw.restUntilMs, 0);
	return {
		template,
		startedAtMs,
		exercise: Math.max(0, Math.round(asNumber(raw.exercise, 0))),
		set: Math.max(0, Math.round(asNumber(raw.set, 0))),
		sets: asArray(raw.sets, (item) => {
			if (!isRecord(item)) return null;
			const exercise = asString(item.exercise, "");
			const value = asNumber(item.value, -1);
			const kg = asNumber(item.kg, 0);
			return exercise && value >= 0
				? {
						exercise,
						value,
						unit: item.unit === "s" ? "s" : "reps",
						...(kg > 0 ? { kg } : {}),
					}
				: null;
		}),
		restUntilMs: rest > 0 ? rest : null,
		pausedAtMs: pausedAt > 0 ? pausedAt : null,
		pausedMs: Math.max(0, asNumber(raw.pausedMs, 0)),
		snapshot: parseTemplate(raw.snapshot),
	};
}

export const useLiveSession = createDocumentStore<LiveSession | null>(
	"training-live",
	null,
	parseLive,
);
