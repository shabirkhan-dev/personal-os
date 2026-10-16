import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { estimateKcal } from "./kcal";
import { SKILLS, setsLabel, TEMPLATES, templateById } from "./library";
import { parseTrainingLine } from "./parse-training-line";
import {
	buildWeek,
	clockTime,
	lastValue,
	negativeSplit,
	personalBests,
	rebalance,
	roundAt,
	sessionLine,
	slotState,
	trainingNotes,
	weekCount,
	weekDays,
	weeksInARow,
} from "./training-math";
import {
	defaultSettings,
	parsePlan,
	parseSession,
	parseSettings,
	parseSkill,
	type Session,
} from "./training-model";

const now = new Date("2026-10-16T13:00:00"); // a Friday
const week = weekDays(now);
const today = "2026-10-16";
const settings = { ...defaultSettings(), setUp: true };

const session = (day: string, template: string | null, extra: Partial<Session> = {}): Session => ({
	id: `${day}-${template}`,
	template,
	sport: templateById(template)?.sport ?? "calisthenics",
	title: templateById(template)?.title ?? "Workout",
	startedAt: new Date(`${day}T07:00:00`).toISOString(),
	durationMin: 45,
	distanceKm: null,
	kcal: 300,
	feel: null,
	sets: [],
	rounds: null,
	splits: [],
	climbM: null,
	avgHr: null,
	note: "",
	...extra,
});

describe("library", () => {
	it("every photo is bundled and every template is complete", () => {
		const photos = new Set<string>(SKILLS.map((skill) => skill.photo));
		for (const template of TEMPLATES) {
			photos.add(template.photo);
			for (const item of template.exercises) photos.add(item.photo);
		}
		for (const photo of photos) {
			expect(existsSync(join(import.meta.dir, "../../../../assets/training", `${photo}.jpg`))).toBe(
				true,
			);
		}
		expect(templateById("push-handstand")?.exercises).toHaveLength(7);
		expect(
			setsLabel({ name: "x", photo: "", sets: 3, target: null, unit: "reps", restS: 90, note: "" }),
		).toBe("3 × max");
		expect(
			setsLabel({
				name: "x",
				photo: "",
				sets: 3,
				target: 5,
				unit: "reps",
				restS: 90,
				note: "",
				each: true,
			}),
		).toBe("3 × 5 each");
		expect(
			setsLabel({ name: "x", photo: "", sets: 4, target: 30, unit: "s", restS: 90, note: "" }),
		).toBe("4 × 30 s");
	});
});

describe("the week", () => {
	it("builds five sessions that take turns by sport, with easy days left", () => {
		const slots = buildWeek(settings, week);
		expect(slots.map((slot) => slot.template)).toEqual([
			"pull-core",
			"easy-run",
			"shadow-boxing",
			null,
			"push-handstand",
			"long-run",
			null,
		]);
		const yoga = buildWeek({ ...settings, sports: ["calisthenics", "yoga"], daysPerWeek: 3 }, week);
		expect(yoga.map((slot) => slot.template)).toEqual([
			"pull-core",
			"mobility",
			"push-handstand",
			"mobility",
			"legs-core",
			"mobility",
			"mobility",
		]);
	});

	it("knows done, missed, today and rest, and moves a missed session to an easy day", () => {
		const slots = buildWeek(settings, week);
		const sessions = [session("2026-10-12", "pull-core"), session("2026-10-13", "easy-run")];
		expect(slots.map((slot) => slotState(slot, sessions, today))).toEqual([
			"done",
			"done",
			"missed",
			"rest",
			"today",
			"planned",
			"rest",
		]);
		const moved = rebalance(slots, sessions, today);
		expect(moved[6]).toMatchObject({ template: "shadow-boxing", movedFrom: "2026-10-14" });
		expect(rebalance(moved, sessions, today)).toEqual(moved);
		expect(weekCount({ id: week[0] ?? "", slots, createdAt: "" }, sessions, week)).toEqual({
			done: 2,
			goal: 5,
		});
	});
});

describe("numbers", () => {
	const runs = [
		session("2026-09-20", "easy-run", { distanceKm: 5, durationMin: 30 }),
		session("2026-10-14", "easy-run", {
			distanceKm: 5.02,
			durationMin: 27.67,
			splits: [348, 339, 330, 324, 312],
		}),
	];
	const pulls = [
		session("2026-09-25", "pull-core", {
			sets: [{ exercise: "Pull-ups", value: 10, unit: "reps" }],
		}),
		session("2026-10-12", "pull-core", {
			sets: [
				{ exercise: "Pull-ups", value: 12, unit: "reps" },
				{ exercise: "Pull-ups", value: 9, unit: "reps" },
			],
		}),
	];

	it("formats times, paces and lines", () => {
		expect(clockTime(1660)).toBe("27:40");
		expect(clockTime(3912)).toBe("1:05:12");
		expect(sessionLine(runs[1] as Session)).toBe("5.0 km · 27:40 · 5:31 /km");
		expect(sessionLine(pulls[1] as Session)).toBe("45 min · 12 pull-ups best");
		expect(negativeSplit([348, 339, 330, 324, 312])).toBe(true);
		expect(negativeSplit([300, 310])).toBe(false);
	});

	it("finds bests against two weeks ago and the number to beat", () => {
		const bests = personalBests([...runs, ...pulls], now);
		expect(bests[0]).toEqual({ label: "Pull-ups", value: "12", change: "▲ 2", fresh: false });
		expect(bests[1]).toMatchObject({ label: "5 km", value: "27:34", change: "▼ 2:26" });
		expect(lastValue(pulls, "Pull-ups")).toBe(12);
		expect(lastValue(pulls, "Dips")).toBeNull();
	});

	it("counts weeks of boxing in a row and notices things", () => {
		const boxing = [
			session("2026-10-01", "shadow-boxing"),
			session("2026-10-07", "shadow-boxing"),
			session("2026-10-14", "shadow-boxing"),
		];
		expect(weeksInARow(boxing, "boxing", now)).toBe(3);
		const plan = { id: week[0] ?? "", slots: buildWeek(settings, week), createdAt: "" };
		const notes = trainingNotes({ sessions: [...pulls, ...boxing], plan, today, now });
		expect(notes.map((note) => note.kind)).toEqual(["pull-ups", "long-run", "missed", "boxing"]);
	});

	it("runs a rounds timer", () => {
		expect(roundAt(0, 6, 180, 60)).toMatchObject({ round: 1, work: true, left: 180 });
		expect(roundAt(200, 6, 180, 60)).toMatchObject({ round: 1, work: false, left: 40 });
		expect(roundAt(3 * 240 + 46, 6, 180, 60)).toMatchObject({ round: 4, work: true, left: 134 });
		expect(roundAt(5 * 240 + 181, 6, 180, 60).done).toBe(true);
	});

	it("estimates calories from MET and pace", () => {
		expect(estimateKcal("calisthenics", 60, 65)).toBe(325);
		expect(estimateKcal("running", 30, 65, 5)).toBe(325);
	});
});

describe("ask bar", () => {
	it("reads runs, rounds, sets and screens", () => {
		expect(parseTrainingLine("ran 5 km in 28:30")).toEqual({
			kind: "log",
			session: {
				sport: "running",
				template: "easy-run",
				title: "Easy run",
				durationMin: 29,
				distanceKm: 5,
				rounds: null,
				sets: [],
			},
		});
		expect(parseTrainingLine("long run 8k 50 min")).toMatchObject({
			session: { template: "long-run", distanceKm: 8, durationMin: 50 },
		});
		expect(parseTrainingLine("shadow boxing 6 rounds")).toMatchObject({
			session: { sport: "boxing", rounds: 6, durationMin: 24 },
		});
		expect(parseTrainingLine("did push day, 30 push-ups")).toMatchObject({
			session: { template: "push-handstand", sets: [{ exercise: "Push-ups", value: 30 }] },
		});
		expect(parseTrainingLine("12 pull-ups")).toMatchObject({
			session: { sport: "calisthenics", sets: [{ exercise: "Pull-ups", value: 12 }] },
		});
		expect(parseTrainingLine("start")).toEqual({ kind: "start" });
		expect(parseTrainingLine("skills")).toEqual({ kind: "open", screen: "skills" });
		expect(parseTrainingLine("should I train if I slept badly?")).toMatchObject({
			kind: "question",
		});
	});
});

describe("parsing", () => {
	it("repairs damaged rows", () => {
		expect(parseSettings({ sports: ["boxing", "chess"], daysPerWeek: 12, phase: 9 })).toMatchObject(
			{ sports: ["boxing"], daysPerWeek: 7, phase: 1 },
		);
		expect(parseSession({ id: "a", startedAt: "nope", durationMin: 10 })).toBeNull();
		expect(
			parseSession({
				id: "a",
				startedAt: "2026-10-16T07:00:00Z",
				durationMin: 10,
				feel: "great",
				splits: [10, 330],
			}),
		).toMatchObject({ feel: null, splits: [330] });
		expect(
			parsePlan({
				id: "2026-10-12",
				slots: [{ day: "2026-10-13", template: "easy-run" }, { day: "bad" }],
			})?.slots,
		).toHaveLength(1);
		expect(parseSkill({ id: "s", name: "Planche", steps: [], done: 2 })).toBeNull();
		expect(parseSkill({ id: "s", name: "Planche", steps: ["a", "b"], done: 9 })?.done).toBe(2);
	});
});
