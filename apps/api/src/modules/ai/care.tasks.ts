import type { Config } from "@/config/env";
import { askJson } from "./ai.ask";
import { type AskCareInput, type CareAnswer, careAnswer } from "./care.schema";

type Deps = { config: Config };

const GUIDANCE =
	"Answer a question about skin, hair, body, nails or teeth care, using the person's concerns, " +
	"skin type, current routine, latest self-ratings (1 fine to 5 bad) and today's UV. Prefer " +
	"simple, affordable basics and one change at a time; for sensitive skin say to patch test. " +
	"Keep the answer under 90 words and offer up to three short follow-up questions. This is " +
	"general care guidance, not medical advice: for pain, bleeding, sudden or patchy hair loss, " +
	"changing moles or anything that worries them, say to see a dermatologist or doctor.";

/** The Care module's AI task: answering a care question. The mock answers from the input. */
export async function askCare(deps: Deps, input: AskCareInput): Promise<CareAnswer> {
	if (deps.config.ai.provider === "mock") {
		return {
			answer: `You asked “${input.question}”. With a provider key set, the answer appears here.`,
			followUps: ["What should I change first?"],
		};
	}
	return askJson(deps.config, "Care", "care-ask", GUIDANCE, JSON.stringify(input), careAnswer);
}
