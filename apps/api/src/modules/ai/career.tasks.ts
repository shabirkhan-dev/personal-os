import type { Config } from "@/config/env";
import { askJson } from "./ai.ask";
import * as mock from "./career.mock";
import {
	type InterviewPrep,
	type InterviewPrepInput,
	interviewPrep,
	type JobDetails,
	jobDetails,
	type NudgeDraft,
	type NudgeInput,
	nudgeDraft,
	type ParsedLine,
	type ParseLineInput,
	parsedLine,
	type ReadJobInput,
	type SkillPath,
	type SkillPathInput,
	skillPath,
} from "./career.schema";
import { fetchPageText } from "./web-page";

/**
 * The Career module's AI tasks. Each asks the model for one JSON object matching a schema and
 * validates the answer. With the mock provider (local and tests) every task answers from the input,
 * so the app works without a key.
 */

const HALAL_RULE =
	"Halal check: judge only what the company itself earns from. Flag interest-based lending or " +
	"banking, gambling or betting, alcohol, pork, tobacco and adult content. Use 'unsure' when the " +
	"text does not say what the company does. Never claim certainty; the user checks it.";

type Deps = { config: Config; readPage?: (url: string) => Promise<string> };

export async function readJob(deps: Deps, input: ReadJobInput): Promise<JobDetails> {
	const text = input.text ?? (await (deps.readPage ?? fetchPageText)(input.url ?? ""));
	if (deps.config.ai.provider === "mock") return mock.readJob(text, input.url);
	const prompt =
		"Extract the job post's company, role, pay (as written, with currency), where " +
		"(remote/onsite, city, working hours) and a one-line summary. Leave a field empty rather " +
		`than guess. ${HALAL_RULE}`;
	return askJson(deps.config, "Career", "read-job", prompt, `Job post:\n${text}`, jobDetails);
}

export async function parseLine(deps: Deps, input: ParseLineInput): Promise<ParsedLine> {
	if (deps.config.ai.provider === "mock") return mock.parseLine(input.text);
	const prompt =
		"The user logs job-hunt progress in one line, e.g. 'applied to tessera, senior typescript, " +
		"500k, remote'. Return the application it describes with its stage (saved, applied, " +
		"interview, offer or closed). Suggest followUpInDays (usually 7) only for a new " +
		"application. Set interviewAt only if the line books an interview, resolving relative days " +
		`against today (${input.today}). ${HALAL_RULE} If the line is not about a job, return ` +
		"application null.";
	return askJson(deps.config, "Career", "parse-line", prompt, input.text, parsedLine);
}

const TONES: Record<NudgeInput["tone"], string> = {
	"as-is": "plain and friendly",
	shorter: "at most three short sentences",
	warmer: "warm and personal",
	formal: "formal and polished",
};

export async function draftNudge(deps: Deps, input: NudgeInput): Promise<NudgeDraft> {
	if (deps.config.ai.provider === "mock") return mock.nudge(input);
	const prompt =
		"Write a short follow-up email from a job applicant to the company contact. Mention one or " +
		"two of the applicant's stories that fit the role, offer a call, sign with the sender's " +
		`first name. Tone: ${TONES[input.tone]}. No buzzwords, no exaggeration, no placeholders.`;
	const { tone: _tone, ...details } = input;
	return askJson(deps.config, "Career", "nudge", prompt, JSON.stringify(details), nudgeDraft);
}

export async function buildInterviewPrep(
	deps: Deps,
	input: InterviewPrepInput,
): Promise<InterviewPrep> {
	if (deps.config.ai.provider === "mock") return mock.prep(input);
	const prompt =
		"Build interview prep for this application: 4-5 topics to revise (title plus one line of " +
		"what to cover), 3 sharp questions the candidate can ask, and 8-12 flashcards (question on " +
		"the front, a short correct answer on the back, an optional one-line code snippet). Tie " +
		"topics to the role and the notes.";
	return askJson(
		deps.config,
		"Career",
		"interview-prep",
		prompt,
		JSON.stringify(input),
		interviewPrep,
	);
}

export async function planSkillPath(deps: Deps, input: SkillPathInput): Promise<SkillPath> {
	if (deps.config.ai.provider === "mock") return mock.skillPath(input);
	const prompt =
		`Plan a ${input.weeks}-week skill path on the focus below, 30 minutes a day, five days a ` +
		"week. Each week has a title, a one-line goal and five day sessions (title and what to do). " +
		"Build up to something the learner can show an employer.";
	return askJson(deps.config, "Career", "skill-path", prompt, JSON.stringify(input), skillPath);
}
