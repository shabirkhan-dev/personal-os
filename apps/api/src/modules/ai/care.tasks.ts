import type { Config } from "@/config/env";
import { askJson } from "./ai.ask";
import {
	type AskCareInput,
	type CareAnswer,
	careAnswer,
	type DesignRoutineInput,
	type RoutineDraft,
	routineDraft,
} from "./care.schema";

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

const DESIGN =
	"Design a simple morning and night routine for skin, hair and body from the person's " +
	"concerns, skin type and notes. Use the products they already have where they fit, and keep " +
	"it short: three or four face steps a routine, a few weekly steps at most. For each step give " +
	"a short line and plain how-to-apply instructions (amount, where, how long, what to avoid). " +
	"Add up to three small daily habits only if they help. For sensitive skin say to patch test. " +
	"General care guidance, not medical advice.";

/** Drafts a routine the person reviews before anything is saved. */
export async function designRoutine(deps: Deps, input: DesignRoutineInput): Promise<RoutineDraft> {
	if (deps.config.ai.provider === "mock") {
		return {
			steps: [
				{
					routine: "morning",
					area: "face",
					name: "Cleanser",
					detail: "Gentle wash · 1 min",
					howTo: "Wet your face, massage a small amount for a minute, rinse with lukewarm water.",
					minutes: 1,
					days: [],
				},
				{
					routine: "morning",
					area: "face",
					name: "Sunscreen",
					detail: "Two finger lengths",
					howTo: "Last step in the morning. Face, neck and ears; again after 2 to 3 hours outside.",
					minutes: 1,
					days: [],
				},
				{
					routine: "night",
					area: "face",
					name: "Moisturiser",
					detail: "Pea size",
					howTo: "On slightly damp skin, pat in rather than rub.",
					minutes: 1,
					days: [],
				},
			],
			habits: [],
			note: `A short starting routine for ${input.concerns.join(", ") || "everyday care"}. With a provider key set, it is designed here.`,
		};
	}
	return askJson(
		deps.config,
		"Care",
		"design-routine",
		DESIGN,
		JSON.stringify(input),
		routineDraft,
	);
}
