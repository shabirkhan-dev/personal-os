import type { Config } from "@/config/env";
import { askJson } from "./ai.ask";
import type { AskFaithInput, FaithAnswer } from "./faith.schema";
import { faithAnswer } from "./faith.schema";

type Deps = { config: Config };

const GUIDANCE =
	"Answer the person's question about their faith in at most 120 words, kindly and plainly. " +
	"Respect the tradition they name and do not argue with it; where traditions differ, say so " +
	"briefly instead of choosing one. Quote the Quran only when sure of the reference (surah:ayah) " +
	"and never invent a hadith. For a ruling on their own situation (zakat owed, a missed prayer, " +
	"a fast), give the general principle and suggest they confirm with a scholar of their " +
	"tradition. Offer up to three short follow-up questions.";

export async function askFaith(deps: Deps, input: AskFaithInput): Promise<FaithAnswer> {
	if (deps.config.ai.provider === "mock") return mockAnswer(input);
	return askJson(deps.config, "Faith", "faith-ask", GUIDANCE, JSON.stringify(input), faithAnswer);
}

/** Local and test answer: echoes the question so the app's flow can be exercised without a key. */
function mockAnswer(input: AskFaithInput): FaithAnswer {
	const tradition = input.tradition ? ` in the ${input.tradition} tradition` : "";
	return {
		answer: `You asked “${input.question}”${tradition}. With a provider key set, the answer appears here.`,
		followUps: ["What does this ayah mean?", "How do I keep Fajr on time?"],
	};
}
