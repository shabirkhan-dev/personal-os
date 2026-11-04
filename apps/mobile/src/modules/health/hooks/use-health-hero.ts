import type { HomeHero } from "@/modules/home/lib/module-home";
import { healthRoutes } from "../navigation";
import { useHealthToday } from "./use-health";

/** "Health · ready / 82 today", else the latest blood pressure, else a nudge to add one. */
export function useHealthHero(): HomeHero {
	const { data, readiness, bp } = useHealthToday();
	if (data.loading) return { label: "Health", value: "…" };
	if (readiness) {
		return {
			label: `Health · ${readiness.label.toLowerCase()}`,
			value: String(readiness.score),
			faint: " readiness",
			onLabelPress: () => healthRoutes.vitals("sleep"),
		};
	}
	if (bp?.value2) {
		return {
			label: "Health · last blood pressure",
			value: `${bp.value}/${bp.value2}`,
			faint: " mmHg",
			onLabelPress: () => healthRoutes.vitals("bp"),
		};
	}
	return { label: "Health · getting started", value: "No", faint: " readings yet" };
}

/** The Overview / picker line for Health. */
export function useHealthStatus(): string {
	const { data, doses, due } = useHealthToday();
	if (data.loading) return "Loading…";
	const open = doses.filter((dose) => dose.state === "due").length;
	if (open > 0) return `${open} ${open === 1 ? "dose" : "doses"} to take now`;
	const next = due[0];
	if (next?.overdue) return `${next.checkup.title} is overdue`;
	if (next) return `${next.checkup.title} · ${next.due}`;
	return "Blood pressure, checkups and medicines";
}
