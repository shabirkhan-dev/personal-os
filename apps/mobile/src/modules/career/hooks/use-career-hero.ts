import { useFinanceSummary } from "@/modules/finance";
import type { HomeHero } from "@/modules/home/lib/module-home";
import { followUps, runwayWeeks } from "../lib/career-math";
import { useCareerUi } from "./career-ui-store";
import { useCareer, useNow } from "./use-career";

/** "Career · runway left / 9 weeks"; asks to set the runway until cash is known. */
export function useCareerHero(): HomeHero {
	const { settings } = useCareer();
	const finance = useFinanceSummary();
	const now = useNow();
	const openRunway = useCareerUi((state) => state.openRunway);
	const weeks = runwayWeeks(settings, finance.spentThisMonth, now);

	if (weeks === null) {
		return { label: "Career · runway", value: "Set", faint: " runway", onLabelPress: openRunway };
	}
	return {
		label: "Career · runway left",
		value: String(weeks),
		faint: weeks === 1 ? " week" : " weeks",
		hideable: true,
		onLabelPress: openRunway,
	};
}

/** Picker line: "2 follow-ups due", "4 applied this week"… */
export function useCareerStatus(): string {
	const { apps, loading } = useCareer();
	const now = useNow();
	if (loading) return "Loading…";
	const due = followUps(apps, now).filter((item) => item.due).length;
	if (due > 0) return `${due} follow-up${due === 1 ? "" : "s"} due`;
	const open = apps.filter((app) => app.stage !== "closed").length;
	return open > 0 ? `${open} in your pipeline` : "Add your first job";
}
