import type { Stage } from "./career-model";

/** What a logged line describes; the same shape the AI returns, so both paths save alike. */
export type ParsedLine = {
	application: {
		company: string;
		role: string;
		pay: string;
		where: string;
		stage: Stage;
	} | null;
	followUpInDays: number | null;
};

const STAGE_WORDS: ReadonlyArray<[Stage, RegExp]> = [
	["interview", /\binterview/i],
	["offer", /\boffer/i],
	["closed", /\b(rejected|rejection|closed|declined)\b/i],
	["applied", /\b(applied|apply|sent)\b/i],
	["saved", /\b(saved|save|found|bookmark)/i],
];

const LEAD =
	/^(i\s+)?(applied|apply|sent|saved|save|found|bookmarked?|interview(ing)?|offer|got an offer|rejected)(\s+(to|at|for|with|from|by))?\s+/i;

const titleCase = (value: string) =>
	value.replace(
		/\b([a-z])([a-z]*)/gi,
		(_, first: string, rest: string) => first.toUpperCase() + rest.toLowerCase(),
	);

/**
 * The offline fallback for the ask bar: "applied to tessera, senior typescript, 500k, remote".
 * Comma-separated parts after the company are matched to pay (has a digit), where (remote,
 * onsite, hybrid or a city after "in") and role (the rest). Returns no application when the line
 * names no job stage.
 */
export function parseCareerLine(line: string): ParsedLine {
	const stage = STAGE_WORDS.find(([, pattern]) => pattern.test(line))?.[0];
	if (!stage) return { application: null, followUpInDays: null };

	const [head = "", ...rest] = line
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);
	const company = head.replace(LEAD, "").trim();
	if (!company) return { application: null, followUpInDays: null };

	const pay = rest.find((part) => /\d/.test(part)) ?? "";
	const where = rest.find((part) => /\b(remote|onsite|on-site|hybrid|office)\b/i.test(part)) ?? "";
	const role = rest.find((part) => part !== pay && part !== where) ?? "";

	return {
		application: {
			company: titleCase(company).slice(0, 120),
			role: titleCase(role).slice(0, 120),
			pay: pay.slice(0, 80),
			where: where ? where.charAt(0).toUpperCase() + where.slice(1) : "",
			stage,
		},
		followUpInDays: stage === "applied" ? 7 : null,
	};
}

/** True when the text is a link the add sheet should read instead of a line to log. */
export function looksLikeLink(text: string): boolean {
	return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(text.trim());
}

export function normaliseLink(text: string): string {
	const trimmed = text.trim();
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
