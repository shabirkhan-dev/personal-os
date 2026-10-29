import type { ApplicationSummary, Card } from "@personal-os/domain/assistant";
import {
	type Application,
	createApplication,
	defaultSettings,
	parseApplication,
	parseFlashcard,
	parseSettings,
	parseSkillPlan,
	STAGE_LABELS,
	STAGES,
	type Stage,
	withContact,
	withEdit,
	withFollowUp,
	withInterview,
	withNudge,
	withStage,
} from "@personal-os/domain/career";
import * as z from "zod";

import { getRecord, listRecords, putRecord } from "../assistant.records";
import { localDate, localLabel, zonedToDate } from "../assistant.time";
import { defineTool, type ToolContext, ToolError, type UndoWrite } from "../assistant.tool";

const APPLICATIONS = "career-applications";
const PREPS = "career-preps";
const FLASHCARDS = "career-flashcards";

const DAY_MS = 86_400_000;

function summary(app: Application): ApplicationSummary {
	return {
		id: app.id,
		company: app.company,
		role: app.role,
		stage: app.stage,
		pay: app.pay,
		where: app.where,
		followUpAt: app.followUpAt,
		interviewAt: app.interview?.at ?? null,
	};
}

/** What the model reads for an application: one line of facts, local times, no history. */
function brief(app: Application, ctx: ToolContext) {
	const zone = ctx.context.timeZone;
	return {
		id: app.id,
		company: app.company,
		role: app.role,
		stage: app.stage,
		pay: app.pay || undefined,
		where: app.where || undefined,
		followUpOn: app.followUpAt ? localDate(new Date(app.followUpAt), zone) : undefined,
		interview: app.interview
			? `${localLabel(new Date(app.interview.at), zone)} (${app.interview.round || "interview"})`
			: undefined,
	};
}

const loadAll = (ctx: ToolContext) =>
	listRecords(ctx.db, ctx.userId, APPLICATIONS, parseApplication);

/**
 * Finds the application meant by `ref`: its id, or words from the company or role ("tessera",
 * "the frontend role"). Several matches come back to the model to ask the person which one.
 */
async function resolve(ctx: ToolContext, ref: string): Promise<Application> {
	const all = await loadAll(ctx);
	const byId = all.find((app) => app.id === ref);
	if (byId) return byId;
	const words = ref.toLowerCase().split(/\s+/).filter(Boolean);
	const matches = all.filter((app) => {
		const hay = `${app.company} ${app.role}`.toLowerCase();
		return words.every((word) => hay.includes(word));
	});
	const [only, ...rest] = matches;
	if (only && rest.length === 0) return only;
	if (matches.length > 1) {
		throw new ToolError(`More than one application matches "${ref}". Ask which one.`, {
			candidates: matches.slice(0, 6).map((app) => brief(app, ctx)),
		});
	}
	throw new ToolError(`No application matches "${ref}".`, {
		recent: all
			.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
			.slice(0, 8)
			.map((app) => `${app.company}: ${app.role}`),
	});
}

/** Saves a changed application and returns how to take it back. */
async function save(ctx: ToolContext, next: Application, previous: Application | null) {
	const kept = await putRecord(ctx.db, ctx.userId, APPLICATIONS, next.id, next, ctx.now.getTime());
	if (!kept) throw new ToolError("The phone changed this application a moment ago. Read it again.");
	const undo: UndoWrite[] = [{ collection: APPLICATIONS, id: next.id, previous }];
	return undo;
}

const recordCard = (app: Application): Card => ({
	kind: "record",
	item: summary(app),
	link: { screen: "career-application", id: app.id },
});

const ref = z
	.string()
	.trim()
	.min(1)
	.max(120)
	.describe("The application's id, or words from its company or role, like 'tessera'.");

const careerOverview = defineTool({
	name: "career_overview",
	description:
		"The job hunt at a glance: applications per stage, sent this week against the weekly target, follow-ups due, the next interview and the skill path. Call it first for any general question about career, job search or 'how am I doing'.",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Checking your job hunt",
	run: async (ctx) => {
		const [apps, settingsRows, plans] = await Promise.all([
			loadAll(ctx),
			listRecords(ctx.db, ctx.userId, "career-settings", parseSettings),
			listRecords(ctx.db, ctx.userId, "career-skill-plans", parseSkillPlan),
		]);
		const settings = settingsRows[0] ?? defaultSettings;
		const now = ctx.now.getTime();
		const count = (stage: Stage) => apps.filter((app) => app.stage === stage).length;
		const byStage: Record<Stage, number> = {
			saved: count("saved"),
			applied: count("applied"),
			interview: count("interview"),
			offer: count("offer"),
			closed: count("closed"),
		};
		const weekAgo = now - 7 * DAY_MS;
		const appliedThisWeek = apps.filter((app) =>
			app.events.some((event) => event.kind === "applied" && Date.parse(event.at) >= weekAgo),
		).length;
		const due = apps
			.filter((app) => app.followUpAt && Date.parse(app.followUpAt) <= now + DAY_MS)
			.toSorted((a, b) => (a.followUpAt ?? "").localeCompare(b.followUpAt ?? ""));
		const interviews = apps
			.filter((app) => app.interview && Date.parse(app.interview.at) >= now)
			.toSorted((a, b) => (a.interview?.at ?? "").localeCompare(b.interview?.at ?? ""));
		const next = interviews[0];
		const plan = plans[0];

		const cards: Card[] = [
			{
				kind: "stats",
				title: "Job hunt",
				items: [
					{
						label: "Active",
						value: String(byStage.saved + byStage.applied + byStage.interview + byStage.offer),
					},
					{
						label: "Sent this week",
						value: `${appliedThisWeek} of ${settings.weeklyTarget}`,
						tone: appliedThisWeek >= settings.weeklyTarget ? "success" : "accent",
					},
					{
						label: "Follow-ups due",
						value: String(due.length),
						tone: due.length > 0 ? "caution" : "neutral",
					},
					{ label: "Interviews", value: String(interviews.length) },
				],
			},
		];
		if (due.length > 0) {
			cards.push({
				kind: "records",
				title: "Follow-ups due",
				items: due.slice(0, 5).map(summary),
				empty: "",
				more: { screen: "career-applications" },
			});
		}
		return {
			result: {
				byStage,
				appliedThisWeek,
				weeklyTarget: settings.weeklyTarget,
				followUpsDue: due.slice(0, 8).map((app) => brief(app, ctx)),
				nextInterview: next ? brief(next, ctx) : null,
				skillPath: plan
					? { title: plan.title, startedOn: plan.startedOn, weeks: plan.weeks.length }
					: null,
			},
			cards,
		};
	},
});

const findApplications = defineTool({
	name: "find_applications",
	description:
		"Lists applications, newest first, filtered by words in the company or role, by stage, or to those with a follow-up due. Use it to answer 'which jobs…' questions or to find one before changing it.",
	input: z
		.object({
			query: z.string().trim().max(80).optional().describe("Words from the company or role."),
			stage: z.enum(STAGES).optional(),
			followUpDue: z
				.boolean()
				.optional()
				.describe("Only those whose follow-up is due by tomorrow."),
			limit: z.number().int().min(1).max(25).default(10),
		})
		.strict(),
	effect: "read",
	label: () => "Looking through your applications",
	run: async (ctx, input) => {
		const words = (input.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
		const soon = ctx.now.getTime() + DAY_MS;
		const found = (await loadAll(ctx))
			.filter((app) => !input.stage || app.stage === input.stage)
			.filter((app) => !input.followUpDue || (app.followUpAt && Date.parse(app.followUpAt) <= soon))
			.filter((app) => {
				const hay = `${app.company} ${app.role}`.toLowerCase();
				return words.every((word) => hay.includes(word));
			})
			.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
		const shown = found.slice(0, input.limit);
		const title = input.stage ? `${STAGE_LABELS[input.stage]} applications` : "Applications";
		return {
			result: { total: found.length, applications: shown.map((app) => brief(app, ctx)) },
			cards: [
				{
					kind: "records",
					title,
					items: shown.map(summary),
					empty: "No applications match.",
					more: found.length > shown.length ? { screen: "career-applications" } : undefined,
				},
			],
		};
	},
});

const getApplication = defineTool({
	name: "get_application",
	description:
		"One application in full: pay, place, link, notes, contact, interview, the halal reading and its history. Use it before advising on or changing a specific application.",
	input: z.object({ application: ref }).strict(),
	effect: "read",
	label: () => "Opening the application",
	run: async (ctx, input) => {
		const app = await resolve(ctx, input.application);
		const zone = ctx.context.timeZone;
		return {
			result: {
				...brief(app, ctx),
				link: app.link || undefined,
				cv: app.cv || undefined,
				notes: app.notes || undefined,
				contact: app.contact ?? undefined,
				halal: app.halal,
				history: app.events.map(
					(event) =>
						`${localDate(new Date(event.at), zone)} ${event.kind}${event.note ? `: ${event.note}` : ""}`,
				),
			},
			cards: [recordCard(app)],
		};
	},
});

const addApplication = defineTool({
	name: "add_application",
	description:
		"Adds a job to track, as saved (not sent yet) or applied (sent; a follow-up is set a week out unless told otherwise). Refuses a company and role already tracked; update that one instead.",
	input: z
		.object({
			company: z.string().trim().min(1).max(120),
			role: z.string().trim().min(1).max(120),
			stage: z.enum(["saved", "applied"]),
			pay: z.string().trim().max(80).optional().describe("As written: 'Rs 450k / mo'."),
			where: z.string().trim().max(80).optional().describe("'Remote · UK hours', 'Lahore'."),
			link: z.url().max(500).optional(),
			notes: z.string().trim().max(2000).optional(),
			followUpInDays: z.number().int().min(1).max(60).optional(),
		})
		.strict(),
	effect: "write",
	label: (input) => `Adding ${input.company}`,
	describe: async (_ctx, input) => ({
		title: `Add ${input.company}`,
		detail: `${input.role} · ${STAGE_LABELS[input.stage]}${input.pay ? ` · ${input.pay}` : ""}`,
	}),
	run: async (ctx, input) => {
		const all = await loadAll(ctx);
		const same = all.find(
			(app) =>
				app.company.toLowerCase() === input.company.toLowerCase() &&
				app.role.toLowerCase() === input.role.toLowerCase(),
		);
		if (same) {
			throw new ToolError(
				"This company and role are already tracked; update that one.",
				brief(same, ctx),
			);
		}
		const app = createApplication(input, ctx.now);
		const undo = await save(ctx, app, null);
		return {
			result: { added: brief(app, ctx) },
			cards: [recordCard(app)],
			changed: [APPLICATIONS],
			undo,
		};
	},
});

const updateApplication = defineTool({
	name: "update_application",
	description:
		"Changes an application: move its stage (applied, interview, offer, closed…), edit its details, add a note, set or clear the follow-up date, or save the contact. Only pass what changes.",
	input: z
		.object({
			application: ref,
			stage: z.enum(STAGES).optional(),
			company: z.string().trim().min(1).max(120).optional(),
			role: z.string().trim().min(1).max(120).optional(),
			pay: z.string().trim().max(80).optional(),
			where: z.string().trim().max(80).optional(),
			link: z.url().max(500).optional(),
			addNote: z.string().trim().min(1).max(500).optional().describe("Appended to the notes."),
			followUpOn: z
				.union([z.iso.date(), z.literal("none")])
				.optional()
				.describe("'YYYY-MM-DD' in the person's time zone, or 'none' to clear it."),
			contact: z
				.object({
					name: z.string().trim().min(1).max(80),
					role: z.string().trim().max(80).default(""),
					email: z.string().trim().max(160).default(""),
				})
				.optional(),
		})
		.strict(),
	effect: "write",
	label: () => "Updating the application",
	describe: async (ctx, input) => {
		const app = await resolve(ctx, input.application);
		const parts = [
			input.stage ? `move to ${STAGE_LABELS[input.stage]}` : null,
			input.followUpOn
				? input.followUpOn === "none"
					? "clear the follow-up"
					: `follow up on ${input.followUpOn}`
				: null,
			input.addNote ? `note: "${input.addNote}"` : null,
			input.contact ? `contact ${input.contact.name}` : null,
			input.company || input.role || input.pay || input.where || input.link ? "edit details" : null,
		].filter(Boolean);
		return { title: `Update ${app.company}`, detail: parts.join(" · ") || app.role };
	},
	run: async (ctx, input) => {
		const before = await resolve(ctx, input.application);
		let app = before;
		if (input.stage && input.stage !== app.stage) app = withStage(app, input.stage, ctx.now);
		app = withEdit(app, {
			company: input.company,
			role: input.role,
			pay: input.pay,
			where: input.where,
			link: input.link,
			notes: input.addNote ? [app.notes, input.addNote].filter(Boolean).join("\n") : undefined,
		});
		if (input.followUpOn) {
			app = withFollowUp(
				app,
				input.followUpOn === "none" ? null : zonedToDate(input.followUpOn, ctx.context.timeZone),
			);
		}
		if (input.contact) app = withContact(app, input.contact);
		const undo = await save(ctx, app, before);
		return {
			result: { updated: brief(app, ctx) },
			cards: [recordCard(app)],
			changed: [APPLICATIONS],
			undo,
		};
	},
});

const bookInterview = defineTool({
	name: "book_interview",
	description:
		"Books an interview for an application; its stage becomes interview and the follow-up is cleared. The time is in the person's own time zone.",
	input: z
		.object({
			application: ref,
			at: z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
				.describe("Local start, 'YYYY-MM-DDTHH:MM'."),
			round: z.string().trim().max(80).default("Interview").describe("'Tech round', 'HR call'."),
			minutes: z.number().int().min(10).max(480).default(45),
			interviewers: z.number().int().min(1).max(20).default(1),
		})
		.strict(),
	effect: "write",
	label: () => "Booking the interview",
	describe: async (ctx, input) => {
		const app = await resolve(ctx, input.application);
		const at = zonedToDate(input.at, ctx.context.timeZone);
		return {
			title: `Book ${app.company} interview`,
			detail: `${input.round} · ${at ? localLabel(at, ctx.context.timeZone) : input.at} · ${input.minutes} min`,
		};
	},
	run: async (ctx, input) => {
		const before = await resolve(ctx, input.application);
		const at = zonedToDate(input.at, ctx.context.timeZone);
		if (!at) throw new ToolError("Give the time as 'YYYY-MM-DDTHH:MM'.");
		const app = withInterview(
			before,
			{
				at: at.toISOString(),
				round: input.round,
				minutes: input.minutes,
				interviewers: input.interviewers,
			},
			ctx.now,
		);
		const undo = await save(ctx, app, before);
		return {
			result: { booked: brief(app, ctx) },
			cards: [recordCard(app)],
			changed: [APPLICATIONS],
			undo,
		};
	},
});

const recordFollowUp = defineTool({
	name: "record_follow_up_sent",
	description:
		"Logs that the person sent a follow-up (nudge) for an application; the next one is set a week later. Pass the contact's name if they wrote to someone new.",
	input: z
		.object({ application: ref, contactName: z.string().trim().min(1).max(80).optional() })
		.strict(),
	effect: "write",
	label: () => "Logging the follow-up",
	describe: async (ctx, input) => {
		const app = await resolve(ctx, input.application);
		return { title: `Log follow-up to ${app.company}`, detail: "Next follow-up in a week" };
	},
	run: async (ctx, input) => {
		const before = await resolve(ctx, input.application);
		const contact = input.contactName
			? {
					name: input.contactName,
					role: before.contact?.role ?? "",
					email: before.contact?.email ?? "",
				}
			: undefined;
		const app = withNudge(before, contact, ctx.now);
		const undo = await save(ctx, app, before);
		return {
			result: { nudged: brief(app, ctx) },
			cards: [recordCard(app)],
			changed: [APPLICATIONS],
			undo,
		};
	},
});

const deleteApplication = defineTool({
	name: "delete_application",
	description:
		"Deletes an application with its interview prep and flashcards. Use only when the person asks to delete or remove it; to stop tracking a lost job, move it to closed instead.",
	input: z.object({ application: ref }).strict(),
	effect: "risky",
	label: () => "Deleting the application",
	describe: async (ctx, input) => {
		const app = await resolve(ctx, input.application);
		return { title: `Delete ${app.company}`, detail: `${app.role}, with its prep and flashcards` };
	},
	run: async (ctx, input) => {
		const app = await resolve(ctx, input.application);
		const at = ctx.now.getTime();
		const [prep, cards] = await Promise.all([
			getRecord(ctx.db, ctx.userId, PREPS, app.id, (raw) => raw),
			listRecords(ctx.db, ctx.userId, FLASHCARDS, parseFlashcard),
		]);
		const deck = cards.filter((card) => card.deckId === app.id);
		const undo: UndoWrite[] = [{ collection: APPLICATIONS, id: app.id, previous: app }];
		await putRecord(ctx.db, ctx.userId, APPLICATIONS, app.id, app, at, true);
		if (prep) {
			await putRecord(ctx.db, ctx.userId, PREPS, app.id, prep, at, true);
			undo.push({ collection: PREPS, id: app.id, previous: prep });
		}
		await Promise.all(
			deck.map((card) => putRecord(ctx.db, ctx.userId, FLASHCARDS, card.id, card, at, true)),
		);
		undo.push(...deck.map((card) => ({ collection: FLASHCARDS, id: card.id, previous: card })));
		return {
			result: { deleted: { company: app.company, role: app.role } },
			changed: [APPLICATIONS, PREPS, FLASHCARDS],
			undo,
		};
	},
});

export const careerTools = [
	careerOverview,
	findApplications,
	getApplication,
	addApplication,
	updateApplication,
	bookInterview,
	recordFollowUp,
	deleteApplication,
];
