import type { Card } from "@personal-os/domain/assistant";
import { dayKey, newId } from "@personal-os/domain/dates";
import {
	CHECKUP_KINDS,
	CHECKUP_LABELS,
	type Checkup,
	doseId,
	dosesOn,
	dueCheckups,
	emptyProfile,
	labHistory,
	labStatus,
	latest,
	parseCheckup,
	parseDoseLog,
	parseHealthProfile,
	parseLabResult,
	parseMedicine,
	parseReading,
	parseSymptom,
	READING_LABELS,
	READING_UNITS,
	type Reading,
	type ReadingKind,
	readingBand,
	SUGAR_CONTEXTS,
	SYMPTOM_LABELS,
	SYMPTOMS,
	type Symptom,
} from "@personal-os/domain/health";
import * as z from "zod";

import { listRecords, putRecord } from "../assistant.records";
import { localClock } from "../assistant.time";
import { defineTool, type ToolContext, ToolError } from "../assistant.tool";

const READINGS = "health-readings";
const DOSES = "health-doses";
const CHECKUPS = "health-checkups";
const SYMPTOM_LOG = "health-symptoms";

/** Kinds a person can tell the assistant; steps, sleep and HRV come from the phone's health store. */
const SPOKEN_KINDS = [
	"bp",
	"heart-rate",
	"resting-hr",
	"blood-sugar",
	"spo2",
	"temperature",
	"weight",
] as const;

async function load(ctx: ToolContext) {
	const clock = localClock(ctx.now, ctx.context.timeZone);
	const [readings, medicines, doses, checkups, labs, profiles] = await Promise.all([
		listRecords(ctx.db, ctx.userId, READINGS, parseReading),
		listRecords(ctx.db, ctx.userId, "health-medicines", parseMedicine),
		listRecords(ctx.db, ctx.userId, DOSES, parseDoseLog),
		listRecords(ctx.db, ctx.userId, CHECKUPS, parseCheckup),
		listRecords(ctx.db, ctx.userId, "health-labs", parseLabResult),
		listRecords(ctx.db, ctx.userId, "health-profile", parseHealthProfile),
	]);
	return {
		clock,
		readings,
		medicines,
		doses,
		checkups,
		labs,
		profile: profiles[0] ?? emptyProfile,
	};
}

const shown = (reading: Reading) =>
	reading.kind === "bp" ? `${reading.value}/${reading.value2}` : String(reading.value);

const healthView = defineTool({
	name: "health_view",
	description:
		"Their health at a glance: the latest blood pressure, heart rate, sugar, oxygen, weight and today's steps with each one's band; today's medicine and supplement doses; checkups coming up or overdue; out-of-range lab results; and their health profile (blood group, allergies, conditions). Use it for 'how's my blood pressure', 'did I take my pills', 'when is my next checkup'. Not a diagnosis: suggest a doctor for anything worrying.",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Checking your health",
	run: async (ctx) => {
		const { clock, readings, medicines, doses, checkups, labs, profile } = await load(ctx);
		const today = dayKey(clock.now);
		const minuteNow = clock.now.getUTCHours() * 60 + clock.now.getUTCMinutes();
		const kinds: ReadingKind[] = [
			"bp",
			"resting-hr",
			"heart-rate",
			"blood-sugar",
			"spo2",
			"weight",
			"steps",
		];
		const latestOf = kinds.flatMap((kind) => {
			const reading = latest(readings, kind);
			return reading ? [reading] : [];
		});
		const todayDoses = dosesOn(medicines, doses, today, minuteNow, today);
		const due = dueCheckups(checkups, today).slice(0, 5);
		const outOfRange = [...labHistory(labs).values()].flatMap((history) => {
			const last = history.at(-1);
			const status = last ? labStatus(last) : "unknown";
			return last && (status === "low" || status === "high")
				? [{ test: last.test, value: last.value, unit: last.unit, status }]
				: [];
		});
		const cards: Card[] = [];
		if (latestOf.length) {
			cards.push({
				kind: "stats",
				title: "Latest readings",
				items: latestOf.map((reading) => {
					const band = readingBand(reading);
					return {
						label: READING_LABELS[reading.kind],
						value: `${shown(reading)} ${READING_UNITS[reading.kind]}`,
						tone: band
							? band.tone === "good"
								? "success"
								: band.tone === "watch"
									? "caution"
									: "danger"
							: undefined,
					};
				}),
			});
		}
		return {
			result: {
				latest: latestOf.map((reading) => ({
					kind: reading.kind,
					value: shown(reading),
					unit: READING_UNITS[reading.kind],
					at: clock.shift(reading.at),
					band: readingBand(reading)?.label,
				})),
				dosesToday: todayDoses.map((dose) => ({
					medicine: dose.medicine.name,
					type: dose.medicine.type,
					dose: dose.medicine.dose,
					withFood: dose.medicine.withFood,
					time: `${String(Math.floor(dose.minutes / 60)).padStart(2, "0")}:${String(dose.minutes % 60).padStart(2, "0")}`,
					state: dose.state,
				})),
				checkups: due.map((item) => ({
					title: item.checkup.title,
					due: item.due,
					overdue: item.overdue,
					booked: item.booked,
				})),
				labsOutOfRange: outOfRange,
				profile: {
					bloodGroup: profile.bloodGroup,
					allergies: profile.allergies,
					conditions: profile.conditions,
				},
			},
			cards,
		};
	},
});

const logReading = defineTool({
	name: "log_health_reading",
	description:
		"Logs one reading they measured: blood pressure (value = top number, value2 = bottom), heart rate, resting heart rate, blood sugar in mg/dL (with when: fasting, after-meal or random), oxygen %, temperature in °C or weight in kg.",
	input: z
		.object({
			kind: z.enum(SPOKEN_KINDS),
			value: z.number().positive().max(1_000),
			value2: z.number().positive().max(300).optional(),
			context: z.enum(SUGAR_CONTEXTS).optional(),
		})
		.strict(),
	effect: "write",
	label: (input) => `Logging ${READING_LABELS[input.kind].toLowerCase()}`,
	describe: async (_ctx, input) => ({
		title: `Log ${READING_LABELS[input.kind].toLowerCase()}`,
		detail: `${input.kind === "bp" ? `${input.value}/${input.value2 ?? "?"}` : input.value} ${READING_UNITS[input.kind]}`,
	}),
	run: async (ctx, input) => {
		const reading = parseReading({
			id: newId(),
			kind: input.kind,
			value: input.value,
			value2: input.value2 ?? null,
			at: ctx.now.toISOString(),
			source: "manual",
			context: input.context ?? null,
			note: "",
		});
		if (!reading) {
			throw new ToolError(
				input.kind === "bp"
					? "Blood pressure needs both numbers, the top one bigger (like 120 and 80)."
					: `That ${READING_LABELS[input.kind].toLowerCase()} doesn't look right.`,
			);
		}
		await putRecord(ctx.db, ctx.userId, READINGS, reading.id, reading, ctx.now.getTime());
		const band = readingBand(reading);
		return {
			result: {
				logged: `${READING_LABELS[reading.kind]} ${shown(reading)} ${READING_UNITS[reading.kind]}`,
				band: band?.label,
			},
			changed: [READINGS],
			undo: [{ collection: READINGS, id: reading.id, previous: null }],
		};
	},
});

const logDose = defineTool({
	name: "log_medicine_dose",
	description:
		"Marks today's next open dose of one of their medicines as taken (or skipped). Matches the medicine by name.",
	input: z
		.object({
			medicine: z.string().trim().min(1).max(80),
			status: z.enum(["taken", "skipped"]).default("taken"),
		})
		.strict(),
	effect: "write",
	label: (input) => `Marking ${input.medicine} ${input.status ?? "taken"}`,
	describe: async (_ctx, input) => ({
		title: `${input.medicine}: ${input.status ?? "taken"}`,
		detail: "Today's next dose",
	}),
	run: async (ctx, input) => {
		const { clock, medicines, doses } = await load(ctx);
		const today = dayKey(clock.now);
		const minuteNow = clock.now.getUTCHours() * 60 + clock.now.getUTCMinutes();
		const name = input.medicine.toLowerCase();
		const matches = medicines.filter(
			(medicine) => medicine.active && medicine.name.toLowerCase().includes(name),
		);
		const [medicine, ...others] = matches;
		if (!medicine || others.length) {
			throw new ToolError(
				matches.length
					? `More than one medicine matches "${input.medicine}".`
					: `No medicine called "${input.medicine}".`,
				{
					medicines: medicines.filter((item) => item.active).map((item) => item.name),
				},
			);
		}
		const open = dosesOn([medicine], doses, today, minuteNow, today).find(
			(dose) => dose.state !== "taken" && dose.state !== "skipped",
		);
		if (!open) throw new ToolError(`Every ${medicine.name} dose today is already logged.`);
		const log = {
			id: doseId(medicine.id, today, open.minutes),
			medicineId: medicine.id,
			day: today,
			minutes: open.minutes,
			status: input.status ?? "taken",
			at: ctx.now.toISOString(),
		};
		await putRecord(ctx.db, ctx.userId, DOSES, log.id, log, ctx.now.getTime());
		const undo: { collection: string; id: string; previous: unknown }[] = [
			{ collection: DOSES, id: log.id, previous: null },
		];
		const changed = [DOSES];
		if (log.status === "taken" && medicine.stock !== null && medicine.stock > 0) {
			await putRecord(
				ctx.db,
				ctx.userId,
				"health-medicines",
				medicine.id,
				{ ...medicine, stock: medicine.stock - 1 },
				ctx.now.getTime(),
			);
			undo.push({ collection: "health-medicines", id: medicine.id, previous: medicine });
			changed.push("health-medicines");
		}
		return {
			result: { medicine: medicine.name, status: log.status, dose: open.minutes },
			changed,
			undo,
		};
	},
});

const addCheckup = defineTool({
	name: "add_checkup",
	description:
		"Adds a checkup: one booked (done false) or one that happened (done true), with how many months until it repeats (6 for the dentist, 12 for a yearly blood test).",
	input: z
		.object({
			kind: z.enum(CHECKUP_KINDS),
			title: z.string().trim().max(120).optional(),
			on: z.iso.date(),
			done: z.boolean().default(false),
			repeatMonths: z.number().int().min(1).max(120).optional(),
			note: z.string().trim().max(400).optional(),
		})
		.strict(),
	effect: "write",
	label: (input) => `Adding ${input.title || CHECKUP_LABELS[input.kind]}`,
	describe: async (_ctx, input) => ({
		title: `${input.done ? "Log" : "Book"} ${input.title || CHECKUP_LABELS[input.kind]}`,
		detail: input.on,
	}),
	run: async (ctx, input) => {
		const checkup: Checkup = {
			id: newId(),
			kind: input.kind,
			title: input.title || CHECKUP_LABELS[input.kind],
			on: input.on,
			done: input.done ?? false,
			repeatMonths: input.repeatMonths ?? null,
			note: input.note ?? "",
		};
		await putRecord(ctx.db, ctx.userId, CHECKUPS, checkup.id, checkup, ctx.now.getTime());
		return {
			result: { added: checkup.title, on: checkup.on, done: checkup.done },
			changed: [CHECKUPS],
			undo: [{ collection: CHECKUPS, id: checkup.id, previous: null }],
		};
	},
});

const logSymptom = defineTool({
	name: "log_symptom",
	description:
		"Notes how they feel today: a symptom (headache, tired, stress, low-mood, cold, fever, stomach, back-pain, joint-pain, dizzy, other) and how bad, 1 mild to 3 bad.",
	input: z
		.object({
			symptom: z.enum(SYMPTOMS),
			severity: z.number().int().min(1).max(3).default(2),
			note: z.string().trim().max(200).optional(),
		})
		.strict(),
	effect: "write",
	label: (input) => `Noting ${SYMPTOM_LABELS[input.symptom].toLowerCase()}`,
	describe: async (_ctx, input) => ({
		title: `Note ${SYMPTOM_LABELS[input.symptom].toLowerCase()}`,
		detail: "Today",
	}),
	run: async (ctx, input) => {
		const clock = localClock(ctx.now, ctx.context.timeZone);
		const symptom = parseSymptom({
			id: newId(),
			kind: input.symptom,
			severity: input.severity ?? 2,
			day: dayKey(clock.now),
			at: ctx.now.toISOString(),
			note: input.note ?? "",
		}) as Symptom;
		await putRecord(ctx.db, ctx.userId, SYMPTOM_LOG, symptom.id, symptom, ctx.now.getTime());
		return {
			result: { noted: SYMPTOM_LABELS[symptom.kind], severity: symptom.severity },
			changed: [SYMPTOM_LOG],
			undo: [{ collection: SYMPTOM_LOG, id: symptom.id, previous: null }],
		};
	},
});

export const healthTools = [healthView, logReading, logDose, addCheckup, logSymptom];
