import type {
	InterviewPrep,
	InterviewPrepInput,
	JobDetails,
	NudgeDraft,
	NudgeInput,
	ParsedLine,
	SkillPath,
	SkillPathInput,
} from "./career.schema";

/** Deterministic answers built from the input, used when no AI provider is configured. */

const HALAL = { status: "unsure", note: "Mock reading — check the company yourself." } as const;

const titleCase = (value: string) => value.replace(/\b\w/g, (letter) => letter.toUpperCase());

function find(pattern: RegExp, text: string): string {
	return pattern.exec(text)?.[0]?.trim().slice(0, 80) ?? "";
}

export function readJob(text: string, url?: string): JobDetails {
	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
	const host = url ? new URL(url).hostname.replace(/^www\./, "") : "";
	const company = host ? titleCase(host.split(".")[0] ?? "") : "";
	return {
		company,
		role: (lines[0] ?? "").slice(0, 120),
		pay: find(/(?:rs|pkr|\$|£|€)\s?[\d.,]+\s?k?(?:\s?[–-]\s?[\d.,]+\s?k?)?/i, text),
		where: /\bremote\b/i.test(text) ? "Remote" : "",
		summary: (lines[1] ?? "").slice(0, 400),
		halal: { ...HALAL },
	};
}

const STAGE_WORDS = [
	["interview", ["interview"]],
	["offer", ["offer"]],
	["closed", ["rejected", "closed"]],
	["applied", ["applied", "apply"]],
	["saved", ["saved", "save", "found"]],
] as const;

export function parseLine(text: string): ParsedLine {
	const lowered = text.toLowerCase();
	const stage = STAGE_WORDS.find(([, words]) => words.some((word) => lowered.includes(word)))?.[0];
	if (!stage) return { application: null, followUpInDays: null, interviewAt: null };
	const parts = text
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);
	const company = (parts[0] ?? "").replace(
		/^(applied|apply|saved|save|found|interview|offer|rejected)( to| at| for| with)?\s+/i,
		"",
	);
	const rest = parts.slice(1);
	const pay = rest.find((part) => /\d/.test(part)) ?? "";
	const where = rest.find((part) => /remote|onsite|hybrid/i.test(part)) ?? "";
	const role = rest.find((part) => part !== pay && part !== where) ?? "";
	return {
		application: {
			company: titleCase(company.toLowerCase()).slice(0, 120),
			role: titleCase(role.toLowerCase()).slice(0, 120),
			pay: pay.slice(0, 80),
			where: (where.charAt(0).toUpperCase() + where.slice(1).toLowerCase()).slice(0, 80),
			stage,
			halal: { ...HALAL },
		},
		followUpInDays: stage === "applied" ? 7 : null,
		interviewAt: null,
	};
}

export function nudge(input: NudgeInput): NudgeDraft {
	const greeting = input.contactName ? `Hi ${input.contactName.split(" ")[0]},` : "Hi,";
	const story = input.stories[0];
	const line = story ? ` Recently: ${story.title} — ${story.summary}.` : "";
	const firstName = input.senderName.split(" ")[0] ?? "";
	return {
		subject: `Following up: ${input.role || input.company}`,
		body: `${greeting}\n\nI applied for the ${input.role || "open"} role and wanted to check in.${line}\n\nHappy to share more or jump on a call.\n\nThanks,\n${firstName}`,
	};
}

export function prep(input: InterviewPrepInput): InterviewPrep {
	const role = input.role || "the role";
	const topics = [
		{ title: "The role", detail: `What ${input.company} needs from ${role}` },
		{ title: "Your stories", detail: "Two minutes each, with numbers" },
		{ title: "System design", detail: "One design you can draw and explain" },
		{ title: "Behavioural", detail: "Ownership, a conflict, a hard deadline" },
	];
	return {
		topics,
		questions: [
			"What does a good first 90 days look like?",
			"How do teams split ownership?",
			"What would you want me to improve in the first month?",
		],
		flashcards: topics.map((topic) => ({
			topic: topic.title,
			tag: topic.title,
			front: `What will you say about ${topic.title.toLowerCase()}?`,
			back: topic.detail,
			code: "",
		})),
	};
}

export function skillPath(input: SkillPathInput): SkillPath {
	return {
		title: input.focus.slice(0, 60),
		weeks: Array.from({ length: input.weeks }, (_, index) => ({
			title: `${input.focus} · part ${index + 1}`.slice(0, 60),
			goal: "Learn it, then explain it out loud",
			days: Array.from({ length: 5 }, (__, day) => ({
				title: `Session ${day + 1}`,
				detail: "30 minutes of focused practice",
			})),
		})),
	};
}
