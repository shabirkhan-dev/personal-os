/**
 * The weekly review: what the last seven days held, from what the person logged. Pure, so it can
 * be tested without a phone. Every line is null when its module has nothing to show, so the review
 * never invents a week the person didn't log.
 */

export type ReviewInput = {
	/** Local "YYYY-MM-DD" days, oldest first; the last one is today. */
	days: readonly string[];
	prayers: readonly { day: string; status: "prayed" | "late" | "missed" }[];
	sessions: readonly { startedAt: string; durationMin: number }[];
	spending: readonly { kind: "spend" | "income"; amount: number; at: string }[];
	/** The month's budget, all lines together; 0 when there's none. */
	monthBudget: number;
	meals: readonly { day: string; planned: boolean }[];
	water: readonly { id: string; ml: number }[];
	waterGoalMl: number;
	sleep: readonly { id: string; bedAt: string; wakeAt: string }[];
	care: readonly { id: string; finished: readonly string[] }[];
	hasCare: boolean;
	minimum: readonly { id: string; kept: number; total: number }[];
};

export type ReviewLine = {
	key: "prayers" | "training" | "money" | "meals" | "water" | "sleep" | "care" | "minimum";
	label: string;
	value: string;
	detail: string;
	/** 0–1, how close the week came to the goal; null when there's no goal to compare to. */
	share: number | null;
};

export type Review = { lines: ReviewLine[]; suggestions: string[] };

const pad = (value: number) => String(value).padStart(2, "0");

/** "2026-11-26" in local time. */
export function localDay(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The seven local days ending today, oldest first. */
export function lastSevenDays(now: Date): string[] {
	return Array.from({ length: 7 }, (_, index) =>
		localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index)),
	);
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function rupees(amount: number): string {
	return `Rs ${Math.round(amount).toLocaleString("en-US")}`;
}

function sleepHours(log: { bedAt: string; wakeAt: string }): number | null {
	const hours = (Date.parse(log.wakeAt) - Date.parse(log.bedAt)) / 3_600_000;
	return Number.isFinite(hours) && hours > 0 && hours < 16 ? hours : null;
}

export function buildReview(input: ReviewInput): Review {
	const week = new Set(input.days);
	const inWeek = (iso: string) => week.has(localDay(new Date(iso)));
	const lines: ReviewLine[] = [];
	const suggestions: string[] = [];

	const prayers = input.prayers.filter((log) => week.has(log.day));
	if (prayers.length > 0) {
		const onTime = prayers.filter((log) => log.status === "prayed").length;
		const late = prayers.filter((log) => log.status === "late").length;
		const missed = prayers.filter((log) => log.status === "missed").length;
		const prayed = onTime + late;
		lines.push({
			key: "prayers",
			label: "Prayers",
			value: `${prayed} of 35`,
			detail: `${onTime} on time${late ? `, ${late} late` : ""}${missed ? `, ${missed} missed` : ""}`,
			share: clamp(prayed / 35),
		});
		if (missed > 2) suggestions.push("Turn on prayer reminders for the ones you missed most.");
	}

	const sessions = input.sessions.filter((session) => inWeek(session.startedAt));
	if (sessions.length > 0) {
		const minutes = sessions.reduce((sum, session) => sum + session.durationMin, 0);
		lines.push({
			key: "training",
			label: "Training",
			value: plural(sessions.length, "session"),
			detail: `${Math.round(minutes)} minutes in all`,
			share: clamp(sessions.length / 4),
		});
	}

	const spent = input.spending
		.filter((entry) => entry.kind === "spend" && inWeek(entry.at))
		.reduce((sum, entry) => sum + entry.amount, 0);
	if (spent > 0 || input.monthBudget > 0) {
		const weekBudget = (input.monthBudget * 7) / 30;
		const over = weekBudget > 0 && spent > weekBudget;
		lines.push({
			key: "money",
			label: "Money",
			value: `${rupees(spent)} spent`,
			detail:
				weekBudget > 0
					? over
						? `${rupees(spent - weekBudget)} over a week's share of your budget`
						: `${rupees(weekBudget - spent)} under a week's share of your budget`
					: "No budget set to compare with",
			share: weekBudget > 0 ? clamp(spent / weekBudget) : null,
		});
		if (over) suggestions.push("Spending ran past the week's share. Look at the biggest line.");
	}

	const eaten = input.meals.filter((meal) => !meal.planned && week.has(meal.day));
	if (eaten.length > 0) {
		const daysLogged = new Set(eaten.map((meal) => meal.day)).size;
		lines.push({
			key: "meals",
			label: "Meals",
			value: plural(eaten.length, "meal"),
			detail: `Logged on ${plural(daysLogged, "day")} of 7`,
			share: clamp(daysLogged / 7),
		});
	}

	const water = input.water.filter((day) => week.has(day.id) && day.ml > 0);
	if (water.length > 0) {
		const average = water.reduce((sum, day) => sum + day.ml, 0) / 7;
		const goal = input.waterGoalMl;
		const hit = goal > 0 ? water.filter((day) => day.ml >= goal).length : 0;
		lines.push({
			key: "water",
			label: "Water",
			value: `${(average / 1000).toFixed(1)} L a day`,
			detail: goal > 0 ? `Goal reached on ${plural(hit, "day")}` : "On average this week",
			share: goal > 0 ? clamp(average / goal) : null,
		});
		if (goal > 0 && hit < 4)
			suggestions.push("Water fell short most days. A reminder every 2 h helps.");
	}

	const nights = input.sleep
		.filter((log) => week.has(log.id))
		.map(sleepHours)
		.filter((hours): hours is number => hours !== null);
	if (nights.length > 0) {
		const average = nights.reduce((sum, hours) => sum + hours, 0) / nights.length;
		lines.push({
			key: "sleep",
			label: "Sleep",
			value: `${average.toFixed(1)} h a night`,
			detail: `Over ${plural(nights.length, "night")} logged`,
			share: clamp(average / 8),
		});
		if (average < 6.5)
			suggestions.push("Sleep averaged under 6.5 h. Try winding down 30 minutes earlier.");
	}

	if (input.hasCare) {
		const careDays = input.care.filter((day) => week.has(day.id) && day.finished.length > 0).length;
		lines.push({
			key: "care",
			label: "Care",
			value: `${careDays} of 7 days`,
			detail: "Days with a routine finished",
			share: clamp(careDays / 7),
		});
		if (careDays < 4)
			suggestions.push("Care slipped this week. Keep just the morning routine for now.");
	}

	const minimum = input.minimum.filter((day) => week.has(day.id) && day.total > 0);
	if (minimum.length > 0) {
		const kept = minimum.filter((day) => day.kept >= day.total).length;
		lines.push({
			key: "minimum",
			label: "Minimum day",
			value: `Kept ${kept} of ${minimum.length}`,
			detail: "Days you did the minimum you set",
			share: clamp(kept / minimum.length),
		});
		if (kept < minimum.length / 2) {
			suggestions.push("The minimum day was hard to keep. Make it smaller, then build up.");
		}
	}

	if (lines.length > 0 && suggestions.length === 0) {
		suggestions.push("A steady week. Keep the same plan for the next one.");
	}
	return { lines, suggestions: suggestions.slice(0, 3) };
}
