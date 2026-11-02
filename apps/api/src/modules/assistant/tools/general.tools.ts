import type { AppLink } from "@personal-os/domain/assistant";
import { and, eq, inArray } from "drizzle-orm";
import * as z from "zod";

import { assistantMemories } from "@/db/schema";
import { defineTool, ToolError } from "../assistant.tool";

/** Most facts kept per person; the oldest go first. */
export const MEMORY_LIMIT = 60;

/**
 * Memory is the assistant's own notebook about the person. It never changes their records, so it
 * does not ask first; the person sees and deletes every fact in Profile → Assistant.
 */
const remember = defineTool({
	name: "remember",
	description:
		"Keeps a lasting fact about the person for future chats: a preference, a goal, a routine or a constraint ('plays football on Saturdays', 'wants remote jobs only'). Not for one-off details or anything already in their records. One short sentence per fact.",
	input: z.object({ fact: z.string().trim().min(3).max(300) }).strict(),
	effect: "read",
	label: () => "Remembering that",
	run: async (ctx, input) => {
		const existing = await ctx.db
			.select({ id: assistantMemories.id, text: assistantMemories.text })
			.from(assistantMemories)
			.where(eq(assistantMemories.userId, ctx.userId))
			.orderBy(assistantMemories.createdAt);
		if (existing.some((memory) => memory.text.toLowerCase() === input.fact.toLowerCase())) {
			return { result: { kept: true, alreadyKnown: true } };
		}
		const overflow = existing.length - MEMORY_LIMIT + 1;
		const oldest = existing.slice(0, Math.max(0, overflow)).map((memory) => memory.id);
		if (oldest.length > 0) {
			await ctx.db.delete(assistantMemories).where(inArray(assistantMemories.id, oldest));
		}
		const [row] = await ctx.db
			.insert(assistantMemories)
			.values({ userId: ctx.userId, text: input.fact })
			.returning({ id: assistantMemories.id });
		return { result: { kept: true, id: row?.id } };
	},
});

const forget = defineTool({
	name: "forget",
	description:
		"Removes a remembered fact that is wrong or out of date, by its id from the memory list in your instructions.",
	input: z.object({ id: z.uuid() }).strict(),
	effect: "read",
	label: () => "Forgetting that",
	run: async (ctx, input) => {
		const removed = await ctx.db
			.delete(assistantMemories)
			.where(and(eq(assistantMemories.id, input.id), eq(assistantMemories.userId, ctx.userId)))
			.returning({ id: assistantMemories.id });
		if (removed.length === 0) throw new ToolError("No remembered fact has that id.");
		return { result: { forgotten: true } };
	},
});

const SCREENS = [
	"career",
	"career-applications",
	"career-skill",
	"finance",
	"finance-runway",
	"finance-budget",
	"finance-history",
	"finance-income",
	"finance-insights",
	"training",
	"training-insights",
	"training-programs",
	"training-exercises",
] as const;

const openScreen = defineTool({
	name: "show_screen_link",
	description:
		"Shows a button that opens a screen of the app, when the person would do the next step there (the applications list, the skill path). Records already show their own buttons; don't add one for them.",
	input: z
		.object({
			screen: z.enum(SCREENS),
			label: z.string().trim().min(2).max(40).describe("The button, like 'Open applications'."),
		})
		.strict(),
	effect: "read",
	label: () => "Adding a shortcut",
	run: async (_ctx, input) => ({
		result: { shown: true },
		cards: [{ kind: "link", label: input.label, link: { screen: input.screen } as AppLink }],
	}),
});

const offerChoices = defineTool({
	name: "offer_choices",
	description:
		"Shows 2 to 5 short replies the person can tap, when you ask them to pick (which application, which day, yes or no). Their tap comes back as their next message. Ask the question in your text too.",
	input: z
		.object({
			prompt: z.string().trim().min(2).max(120),
			options: z.array(z.string().trim().min(1).max(60)).min(2).max(5),
		})
		.strict(),
	effect: "read",
	label: () => "Offering choices",
	run: async (_ctx, input) => ({
		result: { shown: true, note: "Wait for the person's pick." },
		cards: [{ kind: "choices", prompt: input.prompt, options: input.options }],
	}),
});

export const generalTools = [remember, forget, openScreen, offerChoices];
