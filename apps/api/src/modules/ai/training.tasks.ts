import type { Config } from "@/config/env";
import { AppError } from "@/core/app-error";
import { askJson } from "./ai.ask";
import {
	type AskTrainingInput,
	type DesignProgramInput,
	type ProgramDraft,
	programDraft,
	type SkillSteps,
	type SkillStepsInput,
	skillSteps,
	type TrainingAnswer,
	trainingAnswer,
} from "./training.schema";

type Deps = { config: Config };

const GUIDANCE =
	"Answer a training question using the person's sports, phase (1 = bodyweight, running and " +
	"shadow boxing at home; 2 = gym and clubs), this week's program and recent sessions. Be " +
	"specific: sets, reps, minutes, which day. Favour consistency over intensity and suggest " +
	"rest when the week is heavy. Keep it under 90 words and offer up to three short follow-up " +
	"questions. For pain or injury, say to stop and see a doctor or physiotherapist.";

export async function askTraining(deps: Deps, input: AskTrainingInput): Promise<TrainingAnswer> {
	if (deps.config.ai.provider === "mock") {
		return {
			answer: `You asked “${input.question}”. With a provider key set, the answer appears here.`,
			followUps: ["What should I do tomorrow?"],
		};
	}
	return askJson(
		deps.config,
		"Training",
		"training-ask",
		GUIDANCE,
		JSON.stringify(input),
		trainingAnswer,
	);
}

const SKILL =
	"Break the skill into 4 to 6 progressive steps, easiest first, each a concrete target the " +
	"person can test (e.g. 'Tuck lever 3 × 10 s'). Bodyweight or running only unless the skill " +
	"needs equipment. Use the level, if given, to choose the first step.";

export async function buildSkill(deps: Deps, input: SkillStepsInput): Promise<SkillSteps> {
	if (deps.config.ai.provider === "mock") {
		return {
			steps: [
				`Learn the basics of ${input.name}`,
				`Practise ${input.name} 3 × a week`,
				`First clean ${input.name}`,
			],
		};
	}
	const result = await askJson(
		deps.config,
		"Training",
		"training-skill",
		SKILL,
		JSON.stringify(input),
		skillSteps,
	);
	if (result.steps.length < 2) throw new AppError("AI_INVALID_OUTPUT");
	return result;
}

const PROGRAM =
	"Design a training program for the person's goal, level, weeks, days a week and minutes per " +
	"session. Use ONLY exercise ids from the exercises list. Make 2 to 6 distinct sessions; each " +
	"has 3 to 7 items. For each item give sets, a low and high target (reps for 'reps', seconds " +
	"for 's', minutes for 'min') and rest in seconds. Start a strength session with a mobility " +
	"warm-up. Balance push and pull, legs and core; respect their sports and equipment. 'order' " +
	"lists the session indexes (0-based) for one week, one per training day, so hard sessions " +
	"don't stack. Title under 40 characters; summary under 60 words.";

const SPORT_NAMES = new Set([
	"calisthenics",
	"running",
	"boxing",
	"yoga",
	"football",
	"volleyball",
	"gym",
	"swimming",
	"walk",
	"cycle",
	"other",
]);
const FOCUS_NAMES = new Set([
	"upper",
	"lower",
	"full",
	"run",
	"boxing",
	"skill",
	"conditioning",
	"mobility",
]);

export type DesignedProgram = {
	title: string;
	summary: string;
	weeks: number;
	sessions: {
		title: string;
		sport: string;
		focus: string;
		minutes: number;
		items: { exercise: string; sets: number; range: [number, number]; restS: number }[];
	}[];
	order: number[];
};

const clampTo = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Keeps only known exercises and sane numbers; fails when no usable session is left. */
export function cleanProgram(input: DesignProgramInput, draft: ProgramDraft): DesignedProgram {
	const units = new Map(input.exercises.map((exercise) => [exercise.id, exercise.unit]));
	const sessions = draft.sessions
		.map((session) => ({
			title: session.title || "Session",
			sport: SPORT_NAMES.has(session.sport) ? session.sport : "calisthenics",
			focus: FOCUS_NAMES.has(session.focus) ? session.focus : "full",
			minutes: clampTo(session.minutes || input.minutes, 10, 180),
			items: session.items
				.filter((item) => units.has(item.exercise))
				.slice(0, 8)
				.map((item) => {
					const max =
						units.get(item.exercise) === "s" ? 300 : units.get(item.exercise) === "min" ? 180 : 100;
					const low = clampTo(item.low || 1, 1, max);
					return {
						exercise: item.exercise,
						sets: clampTo(item.sets || 3, 1, 10),
						range: [low, clampTo(Math.max(low, item.high), low, max)] as [number, number],
						restS: clampTo(item.restS, 0, 600),
					};
				}),
		}))
		.filter((session) => session.items.length > 0)
		.slice(0, 6);
	if (sessions.length === 0) throw new AppError("AI_INVALID_OUTPUT");
	const order = draft.order
		.filter((index) => index >= 0 && index < sessions.length)
		.slice(0, input.daysPerWeek);
	return {
		title: draft.title || "My program",
		summary: draft.summary,
		weeks: clampTo(draft.weeks || input.weeks, 2, 16),
		sessions,
		order:
			order.length > 0
				? order
				: Array.from({ length: input.daysPerWeek }, (_, index) => index % sessions.length),
	};
}

export async function designProgram(
	deps: Deps,
	input: DesignProgramInput,
): Promise<DesignedProgram> {
	if (deps.config.ai.provider === "mock") {
		const [first, second, third] = input.exercises;
		return cleanProgram(input, {
			title: "Mock program",
			summary: `A sample for “${input.goal}”. With a provider key set, the real draft appears here.`,
			weeks: input.weeks,
			sessions: [
				{
					title: "Session A",
					sport: "calisthenics",
					focus: "full",
					minutes: input.minutes,
					items: [first, second, third]
						.filter((exercise) => exercise !== undefined)
						.map((exercise) => ({ exercise: exercise.id, sets: 3, low: 8, high: 12, restS: 60 })),
				},
			],
			order: [0],
		});
	}
	const draft = await askJson(
		deps.config,
		"Training",
		"training-program",
		PROGRAM,
		JSON.stringify(input),
		programDraft,
	);
	return cleanProgram(input, draft);
}
