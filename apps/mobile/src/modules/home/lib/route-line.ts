import type { ModuleId } from "@/modules/onboarding/lib/options";

/**
 * Which module a spoken line belongs to, by its words. Null when nothing matches; the Talk to OS
 * screen then asks the person to pick.
 */
const MODULE_WORDS: readonly [ModuleId, RegExp][] = [
	[
		"faith",
		/\b(pray|prayed|prayer|namaz|salah|salat|fajr|fajar|dhuhr|zuhr|asr|maghrib|isha|quran|recit\w*|tasbih|dhikr|qibla|zakat|dua|ayah|surah|allah|imam|mosque|masjid|jamatkhana)\b/,
	],
	[
		"career",
		/\b(job|jobs|applied|apply|application|interview|recruiter|offer|cv|resume|hiring|role)\b/,
	],
	[
		"fashion",
		/\b(wear|wore|wearing|outfit|wardrobe|closet|overshirt|chinos|jeans|sneakers|tee|polo|blazer|kurta|perfume|cologne|scent)\b/,
	],
	["food", /\b(ate|eat|eaten|breakfast|lunch|dinner|snack|meal|kcal|calories)\b/],
	["finance", /\b(spent|spend|paid|bought|expense|budget|salary|rs|rupees|bill)\b/],
	["workout", /\b(workout|gym|run|ran|walked|steps|pushups|squats|exercise)\b/],
	["skincare", /\b(skincare|serum|sunscreen|moisturi[sz]er|cleanser)\b/],
];

export function routeLine(text: string, enabled: readonly ModuleId[]): ModuleId | null {
	const lower = text.toLowerCase();
	for (const [module, pattern] of MODULE_WORDS) {
		if (enabled.includes(module) && pattern.test(lower)) return module;
	}
	return null;
}
