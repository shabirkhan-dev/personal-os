import type { Config } from "@/config/env";
import { AppError } from "@/core/app-error";
import { askJson } from "./ai.ask";
import {
	type AskTrainingInput,
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
