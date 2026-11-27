import { askJson } from "./ask";
import type { AiConfig } from "./config";
import { type MadeTemplate, type MakeTemplateInput, madeTemplate } from "./templates.schema";

type Deps = { config: AiConfig };

const MAKE =
	"Make the Personal OS template the person asks for, following their message exactly: the " +
	"item fields and allowed values it lists, real and accurate content, nothing invented about " +
	"them. Return the template's title, summary and items.";

/** Makes a template from the person's words; they preview it before anything is added. */
export async function makeTemplate(deps: Deps, input: MakeTemplateInput): Promise<MadeTemplate> {
	if (deps.config.provider === "mock") {
		return {
			title: `Mock ${input.kind}`,
			summary: "With a provider key set, the real template appears here.",
			items: [{ label: "Walk 15 minutes" }],
		};
	}
	return askJson(deps.config, "Templates", "make-template", MAKE, input.prompt, madeTemplate);
}
