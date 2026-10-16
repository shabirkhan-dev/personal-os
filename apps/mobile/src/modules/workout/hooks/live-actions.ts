import { router } from "expo-router";
import { templateById } from "../lib/library";
import { useLiveSession } from "./live-store";

/** Starts a session from its template and opens the right screen: rounds for boxing, sets otherwise. */
export function startSession(templateId: string, now = Date.now()): void {
	const template = templateById(templateId);
	if (!template) return;
	const store = useLiveSession.getState();
	const live = store.data;
	if (!live || live.template !== templateId) {
		store.update(() => ({
			template: templateId,
			startedAtMs: now,
			exercise: 0,
			set: 0,
			sets: [],
			restUntilMs: null,
			pausedAtMs: null,
			pausedMs: 0,
		}));
	}
	router.push(template.sport === "boxing" ? "/training/boxing" : "/training/live");
}

export function endLive(): void {
	useLiveSession.getState().update(() => null);
}
