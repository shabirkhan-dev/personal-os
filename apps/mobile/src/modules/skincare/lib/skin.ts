import { daysSince } from "./products";
import type { CheckIn, SkincareDoc } from "./skincare-types";

/** The newest check-in (by day, then by order logged). */
export function latestCheckIn(checkIns: readonly CheckIn[]): CheckIn | null {
	let latest: CheckIn | null = null;
	for (const checkIn of checkIns) {
		if (!latest || checkIn.dayKey >= latest.dayKey) latest = checkIn;
	}
	return latest;
}

export function checkedAgoLabel(checkIn: CheckIn | null, now: Date): string {
	if (!checkIn) return "Not checked yet";
	const days = daysSince(checkIn.dayKey, now);
	if (days === 0) return "Checked today";
	if (days === 1) return "Checked yesterday";
	return `Checked ${days} days ago`;
}

export function breakoutsLabel(count: number): string {
	return count === 0 ? "None" : `${count} new`;
}

/** One part of the tip; `strong` parts are drawn brighter. */
export type TipPart = { text: string; strong?: boolean };

function hasStep(doc: SkincareDoc, pattern: RegExp): boolean {
	return [...doc.routines.morning, ...doc.routines.night].some((step) => pattern.test(step.name));
}

/**
 * A short, true tip drawn from what the person logged. There is no weather source in the app, so
 * it never states a UV index.
 */
export function skinTip(doc: SkincareDoc): TipPart[] {
	const latest = latestCheckIn(doc.checkIns);
	if (latest && latest.redness === "high") {
		return [
			{ text: "Redness was high", strong: true },
			{ text: " at your last check. Skip acids and retinoids until it calms down." },
		];
	}
	if (latest && latest.hydration === "low") {
		return [
			{ text: "Skin felt dry", strong: true },
			{ text: " last time. Apply moisturizer on slightly damp skin to lock water in." },
		];
	}
	if (hasStep(doc, /sunscreen|spf/i)) {
		return [
			{ text: "Reapply sunscreen", strong: true },
			{ text: " every 2 hours outdoors, and after swimming or sweating." },
		];
	}
	if (hasStep(doc, /retino|treatment|acid/i)) {
		return [
			{ text: "Using actives at night?", strong: true },
			{ text: " Add sunscreen to your morning routine to protect your skin." },
		];
	}
	return [
		{ text: "Consistency wins.", strong: true },
		{ text: " A simple routine done daily beats a long one done sometimes." },
	];
}
