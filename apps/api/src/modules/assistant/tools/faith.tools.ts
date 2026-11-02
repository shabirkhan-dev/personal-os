import type { Card } from "@personal-os/domain/assistant";
import { dayKey, newId } from "@personal-os/domain/dates";
import {
	defaultSettings,
	defaultZakat,
	logId,
	PRAYER_LABELS,
	PRAYER_STATUSES,
	PRAYERS,
	type PrayerLog,
	parsePayment,
	parsePrayerLog,
	parseRecitation,
	parseSettings,
	parseTasbihDay,
	parseZakat,
	prayerStreak,
	recitationStreak,
	recitedOn,
	zakatView,
} from "@personal-os/domain/faith";
import * as z from "zod";

import { getRecord, listRecords, putRecord } from "../assistant.records";
import { localClock } from "../assistant.time";
import { defineTool, type ToolContext, ToolError } from "../assistant.tool";

const LOGS = "faith-prayer-logs";
const RECITATIONS = "faith-recitations";
const TASBIH = "faith-tasbih";
const PAYMENTS = "faith-zakat-payments";

const rupees = (amount: number) => `Rs ${Math.round(amount).toLocaleString("en-US")}`;

/**
 * Faith on the person's clock. Prayer times themselves are worked out on the phone from their
 * place or their own times; these tools read and write what they log.
 */
async function load(ctx: ToolContext) {
	const now = localClock(ctx.now, ctx.context.timeZone).now;
	const [settingsRows, logs, recitations, tasbih] = await Promise.all([
		listRecords(ctx.db, ctx.userId, "faith-settings", parseSettings),
		listRecords(ctx.db, ctx.userId, LOGS, parsePrayerLog),
		listRecords(ctx.db, ctx.userId, RECITATIONS, parseRecitation),
		listRecords(ctx.db, ctx.userId, TASBIH, parseTasbihDay),
	]);
	const settings = settingsRows[0] ?? defaultSettings();
	return { now, today: dayKey(now), settings, logs, recitations, tasbih };
}

const faithToday = defineTool({
	name: "faith_today",
	description:
		"Today's faith: which prayers they keep are logged (prayed, late, missed) or still open, each prayer's on-time streak, Quran recitation today against their daily minutes with its streak, and tasbih counts. Prayer times are on the Faith screen; don't state them.",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Checking your day of prayer",
	run: async (ctx) => {
		const { now, today, settings, logs, recitations, tasbih } = await load(ctx);
		const todayLogs = new Map(
			logs.filter((log) => log.day === today).map((log) => [log.prayer, log]),
		);
		const prayers = settings.prayers.map((prayer) => ({
			prayer,
			status: todayLogs.get(prayer)?.status ?? "open",
			streak: prayerStreak(logs, prayer, now),
		}));
		const recited = recitedOn(recitations, today);
		const counts = tasbih.find((day) => day.id === today)?.counts ?? {};
		const cards: Card[] = [
			{
				kind: "list",
				title: `Prayers today · ${prayers.filter((each) => each.status === "prayed" || each.status === "late").length} of ${prayers.length}`,
				empty: "Pick your prayers in Faith.",
				items: prayers.map((each) => ({
					id: each.prayer,
					title: PRAYER_LABELS[each.prayer],
					subtitle: each.streak > 1 ? `${each.streak} days on time` : undefined,
					value:
						each.status === "open"
							? "Not logged"
							: each.status === "prayed"
								? "Prayed"
								: each.status === "late"
									? "Late"
									: "Missed",
					tone:
						each.status === "prayed"
							? "success"
							: each.status === "late"
								? "caution"
								: each.status === "missed"
									? "danger"
									: "neutral",
					link: { screen: "faith" },
				})),
			},
			{
				kind: "progress",
				title: `Quran · ${recitationStreak(recitations, now)}-day streak`,
				items: [
					{
						label: "Recited today",
						used: recited,
						limit: Math.max(1, settings.recitationMinutes),
						text: `${recited} of ${settings.recitationMinutes} min`,
						tone: recited >= settings.recitationMinutes ? "success" : "accent",
					},
				],
			},
		];
		return {
			result: {
				day: today,
				prayers,
				recitation: {
					today: recited,
					goal: settings.recitationMinutes,
					streak: recitationStreak(recitations, now),
				},
				tasbih: settings.tasbih.map((phrase) => ({
					phrase: phrase.label,
					count: counts[phrase.id] ?? 0,
					target: phrase.target,
				})),
				tradition: settings.tradition || undefined,
			},
			cards,
		};
	},
});

const logPrayer = defineTool({
	name: "log_prayer",
	description:
		"Logs prayers as prayed (on time), late or missed, today unless a day is given. Logging one again replaces it.",
	input: z
		.object({
			prayers: z.array(z.enum(PRAYERS)).min(1).max(5),
			status: z.enum(PRAYER_STATUSES).default("prayed"),
			day: z.iso.date().optional(),
		})
		.strict(),
	effect: "write",
	label: () => "Logging your prayer",
	describe: async (_ctx, input) => ({
		title: `${input.prayers.map((prayer) => PRAYER_LABELS[prayer]).join(", ")}: ${input.status}`,
		detail: input.day ?? "Today",
	}),
	run: async (ctx, input) => {
		const { today } = await load(ctx);
		const day = input.day ?? today;
		const undo = [];
		for (const prayer of input.prayers) {
			const id = logId(day, prayer);
			// oxlint-disable-next-line eslint/no-await-in-loop -- a few prayers, each read before it is replaced
			const before = await getRecord(ctx.db, ctx.userId, LOGS, id, parsePrayerLog);
			const log: PrayerLog = { id, day, prayer, status: input.status, at: ctx.now.toISOString() };
			// oxlint-disable-next-line eslint/no-await-in-loop -- see above
			await putRecord(ctx.db, ctx.userId, LOGS, id, log, ctx.now.getTime());
			undo.push({ collection: LOGS, id, previous: before });
		}
		return { result: { day, logged: input.prayers, status: input.status }, changed: [LOGS], undo };
	},
});

const logRecitation = defineTool({
	name: "log_recitation",
	description: "Logs minutes of Quran recitation today.",
	input: z.object({ minutes: z.number().int().min(1).max(600) }).strict(),
	effect: "write",
	label: () => "Logging your recitation",
	describe: async (_ctx, input) => ({
		title: `Log ${input.minutes} min of recitation`,
		detail: "Today",
	}),
	run: async (ctx, input) => {
		const { today } = await load(ctx);
		const session = { id: newId(), day: today, minutes: input.minutes, at: ctx.now.toISOString() };
		await putRecord(ctx.db, ctx.userId, RECITATIONS, session.id, session, ctx.now.getTime());
		return {
			result: { logged: input.minutes },
			changed: [RECITATIONS],
			undo: [{ collection: RECITATIONS, id: session.id, previous: null }],
		};
	},
});

const addTasbih = defineTool({
	name: "add_tasbih",
	description:
		"Adds counts to today's tasbih for one of their phrases (SubhanAllah, Alhamdulillah…).",
	input: z
		.object({
			phrase: z
				.string()
				.trim()
				.min(2)
				.max(40)
				.describe("The phrase's name, as in their tasbih list."),
			count: z.number().int().min(1).max(10_000),
		})
		.strict(),
	effect: "write",
	label: () => "Adding to your tasbih",
	describe: async (_ctx, input) => ({
		title: `Tasbih: ${input.phrase} +${input.count}`,
		detail: "Today",
	}),
	run: async (ctx, input) => {
		const { today, settings } = await load(ctx);
		const wanted = input.phrase.toLowerCase().replace(/[^a-z]/g, "");
		const phrase = settings.tasbih.find((each) =>
			each.label
				.toLowerCase()
				.replace(/[^a-z]/g, "")
				.includes(wanted),
		);
		if (!phrase)
			throw new ToolError(`No tasbih phrase like "${input.phrase}".`, {
				phrases: settings.tasbih.map((each) => each.label),
			});
		const before = await getRecord(ctx.db, ctx.userId, TASBIH, today, parseTasbihDay);
		const counts = {
			...before?.counts,
			[phrase.id]: (before?.counts[phrase.id] ?? 0) + input.count,
		};
		await putRecord(ctx.db, ctx.userId, TASBIH, today, { id: today, counts }, ctx.now.getTime());
		return {
			result: { phrase: phrase.label, today: counts[phrase.id], target: phrase.target },
			changed: [TASBIH],
			undo: [{ collection: TASBIH, id: today, previous: before }],
		};
	},
});

const zakatStatus = defineTool({
	name: "zakat_status",
	description:
		"Their zakat: what they own and owe, whether it is above nisab, what is due at their rate, what was paid this lunar year (hawl) and what is left, and how many months of the hawl remain.",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Working out your zakat",
	run: async (ctx) => {
		const { now } = await load(ctx);
		const [profile, payments] = await Promise.all([
			getRecord(ctx.db, ctx.userId, "faith-zakat", "zakat", parseZakat),
			listRecords(ctx.db, ctx.userId, PAYMENTS, parsePayment),
		]);
		const view = zakatView(profile ?? defaultZakat(), payments, now);
		return {
			result: {
				owned: view.owned,
				net: view.net,
				nisab: (profile ?? defaultZakat()).nisab,
				aboveNisab: view.aboveNisab,
				due: view.due,
				paid: view.paid,
				left: view.left,
				monthsLeftInHawl: view.hawl ? view.monthsLeft : null,
				setUp: profile !== null,
			},
			cards: [
				{
					kind: "metric",
					label: "Zakat left this year",
					value: rupees(view.left),
					detail: view.aboveNisab
						? `${rupees(view.paid)} paid of ${rupees(view.due)}${view.hawl ? ` · ${view.monthsLeft} lunar months left` : ""}`
						: "Below nisab: nothing is due",
					tone: view.left > 0 ? "caution" : "success",
					link: { screen: "faith-zakat" },
				},
			],
		};
	},
});

const logZakatPayment = defineTool({
	name: "log_zakat_payment",
	description: "Records zakat given: how much and to whom.",
	input: z
		.object({
			amount: z.number().positive().max(100_000_000),
			to: z.string().trim().min(1).max(60),
			note: z.string().trim().max(120).default(""),
		})
		.strict(),
	effect: "write",
	label: () => "Recording your zakat",
	describe: async (_ctx, input) => ({
		title: `Zakat ${rupees(input.amount)} to ${input.to}`,
		detail: input.note,
	}),
	run: async (ctx, input) => {
		const payment = {
			id: newId(),
			to: input.to,
			note: input.note,
			amount: input.amount,
			at: ctx.now.toISOString(),
		};
		await putRecord(ctx.db, ctx.userId, PAYMENTS, payment.id, payment, ctx.now.getTime());
		return {
			result: { recorded: input.amount },
			changed: [PAYMENTS],
			undo: [{ collection: PAYMENTS, id: payment.id, previous: null }],
		};
	},
});

export const faithTools = [
	faithToday,
	logPrayer,
	logRecitation,
	addTasbih,
	zakatStatus,
	logZakatPayment,
];
