import { createDocumentStore } from "@/lib/storage/document-store";
import { asBoolean, isRecord, oneOf } from "@/lib/storage/parse";
import type { ModuleId } from "@/modules/onboarding/lib/options";

export type HomeView = "overview" | ModuleId;

const views: readonly HomeView[] = [
	"overview",
	"daily-life",
	"workout",
	"finance",
	"skincare",
	"food",
	"fashion",
];

export type HomeViewDoc = { view: HomeView; amountsHidden: boolean };

const initial: HomeViewDoc = { view: "overview", amountsHidden: false };

export function parseHomeView(raw: unknown): HomeViewDoc {
	if (!isRecord(raw)) return initial;
	return {
		view: oneOf(raw.view, views, initial.view),
		amountsHidden: asBoolean(raw.amountsHidden, false),
	};
}

/** Which Home is showing (the last module opened comes back next launch) and hidden amounts. */
export const useHomeView = createDocumentStore("home-view", initial, parseHomeView);
