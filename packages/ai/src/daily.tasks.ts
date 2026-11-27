import type { AiConfig } from "./config";
import { askJson } from "./ask";
import { type DayDraft, dayDraft, type DesignDayInput } from "./daily.schema";

type Deps = { config: AiConfig };

const DESIGN =
	"Design one day as time blocks between the person's wake and bed times, in minutes after " +
	"midnight. Keep every fixed block they already have (prayers especially) at its time, then " +
	"fit what their notes ask for: deep work in the morning when they're fresh, training away " +
	"from meals, short breaks between long blocks, and some open time left on purpose. Each block " +
	"has a short title, a one-line detail and the module it belongs to. Don't overlap blocks.";

/** Drafts a day the person reviews and edits before using it. */
export async function designDay(deps: Deps, input: DesignDayInput): Promise<DayDraft> {
	if (deps.config.provider === "mock") {
		const focus = input.wakeAt + 120;
		return {
			blocks: [
				...input.blocks.map((block) => ({ ...block, detail: "Kept from your modules" })),
				{
					minutes: focus,
					length: 120,
					title: "Deep work",
					detail: input.notes ? input.notes.slice(0, 80) : "Your most important thing first",
					module: "daily-life" as const,
				},
			].toSorted((a, b) => a.minutes - b.minutes),
			note: "Your fixed blocks stay; one focus block is added. With a provider key set, the day is designed here.",
		};
	}
	return askJson(deps.config, "Daily life", "design-day", DESIGN, JSON.stringify(input), dayDraft);
}
