import * as z from "zod";

/** The template AI contract: make a template file from the format prompt the app builds. */

export const TEMPLATE_KIND_NAMES = [
	"recipes",
	"programs",
	"exercises",
	"care-routine",
	"tasbih",
	"flashcards",
	"challenge",
	"budget",
	"minimum",
] as const;

export const makeTemplateSchema = z
	.object({
		kind: z.enum(TEMPLATE_KIND_NAMES),
		/** The full prompt: the file shape, the item fields, an example and what the person wants. */
		prompt: z.string().trim().min(20).max(12_000),
	})
	.strict();

const text = (max: number) =>
	z
		.string()
		.default("")
		.transform((value) => value.trim().slice(0, max));

export const madeTemplate = z.object({
	title: text(80),
	summary: text(400),
	items: z.array(z.unknown()).min(1).max(100),
});

export type MakeTemplateInput = z.infer<typeof makeTemplateSchema>;
export type MadeTemplate = z.infer<typeof madeTemplate>;
