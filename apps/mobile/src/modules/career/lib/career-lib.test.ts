/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import {
	type Application,
	defaultSettings,
	parseApplication,
	parseFlashcard,
	parseSettings,
	parseSkillPlan,
	type SkillSession,
} from "./career-model";
import {
	activity,
	appliedThisWeek,
	careerTip,
	dayAndTime,
	followUps,
	nextInterview,
	parseTime,
	pipelineCounts,
	planWeek,
	runwayWeeks,
	skillActivity,
	skillStreak,
	startOfWeek,
	todayLine,
	weekdayIndex,
} from "./career-math";
import { dueCards, formatInterval, nextInterval, review } from "./flashcard-schedule";
import { looksLikeLink, normaliseLink, parseCareerLine } from "./parse-career-line";

// Thursday 15 Oct 2026, 10:00 local time.
const now = new Date(2026, 9, 15, 10, 0);
const iso = (days: number, hours = 9) => new Date(2026, 9, 15 + days, hours).toISOString();

function app(partial: Partial<Application> & { id: string }): Application {
	return {
		company: partial.id,
		role: "Senior Frontend",
		pay: "",
		where: "Remote",
		cv: "",
		link: "",
		notes: "",
		stage: "saved",
		halal: { status: "unsure", note: "", confirmed: false },
		contact: null,
		interview: null,
		followUpAt: null,
		events: [],
		createdAt: iso(-20),
		...partial,
	};
}

describe("career model", () => {
	test("parses applications defensively", () => {
		expect(parseApplication(null)).toBeNull();
		expect(parseApplication({ id: "a" })).toBeNull();
		const parsed = parseApplication({
			id: "a",
			company: "Northwind",
			stage: "bogus",
			createdAt: iso(0),
			events: [
				{ at: iso(0), kind: "applied", note: "" },
				{ at: "nope", kind: "applied" },
			],
			contact: { name: "", email: "" },
		});
		expect(parsed?.stage).toBe("saved");
		expect(parsed?.events).toHaveLength(1);
		expect(parsed?.contact).toBeNull();
		expect(parsed?.halal).toEqual({ status: "unsure", note: "", confirmed: false });
	});

	test("rejects skill plans with no usable weeks and clamps settings", () => {
		expect(
			parseSkillPlan({ id: "plan", startedOn: "2026-10-12", weeks: [{ days: [] }] }),
		).toBeNull();
		expect(parseSettings({ id: "settings", weeklyTarget: 900, cashOnHand: -5 })).toEqual({
			id: "settings",
			weeklyTarget: 50,
			cashOnHand: null,
			monthlyCosts: null,
		});
		expect(parseFlashcard({ id: "c", deckId: "a", front: "" })).toBeNull();
	});
});

describe("career math", () => {
	const apps = [
		app({ id: "saved" }),
		app({
			id: "northwind",
			stage: "applied",
			followUpAt: iso(-1),
			events: [{ at: iso(-8), kind: "applied", note: "" }],
		}),
		app({
			id: "vertex",
			stage: "applied",
			followUpAt: iso(1),
			events: [{ at: iso(-2), kind: "applied", note: "" }],
		}),
		app({
			id: "far",
			stage: "applied",
			followUpAt: iso(20),
			events: [{ at: iso(-1), kind: "applied", note: "" }],
		}),
		app({
			id: "helio",
			stage: "interview",
			interview: { at: iso(1, 15), round: "Technical", minutes: 45, interviewers: 2 },
			events: [{ at: iso(-3), kind: "interview", note: "" }],
		}),
		app({ id: "gone", stage: "closed" }),
	];

	test("counts the pipeline without closed applications", () => {
		expect(pipelineCounts(apps)).toEqual({ saved: 1, applied: 3, interview: 1, offer: 0 });
	});

	test("counts applications sent since Monday", () => {
		expect(startOfWeek(now).getDay()).toBe(1);
		expect(appliedThisWeek(apps, now)).toBe(2);
	});

	test("lists follow-ups due or coming up within a week, soonest first", () => {
		const items = followUps(apps, now);
		expect(items.map((item) => item.app.id)).toEqual(["northwind", "vertex"]);
		expect(items[0]?.due).toBe(true);
		expect(items[0]?.daysSinceApplied).toBe(8);
		expect(items[1]?.due).toBe(false);
	});

	test("finds the next interview and the newest activity", () => {
		expect(nextInterview(apps, now)?.id).toBe("helio");
		expect(activity(apps, 2).map((item) => item.appId)).toEqual(["far", "vertex"]);
		expect(dayAndTime(new Date(2026, 9, 16, 15))).toBe("Fri, 3 PM");
	});

	test("reads typed times", () => {
		expect(parseTime("15:00")).toBe(900);
		expect(parseTime("3 pm")).toBe(900);
		expect(parseTime("12am")).toBe(0);
		expect(parseTime("9.30")).toBe(570);
		expect(parseTime("25:00")).toBeNull();
		expect(parseTime("13pm")).toBeNull();
		expect(parseTime("soon")).toBeNull();
	});

	test("works out runway from cash and costs", () => {
		const settings = { ...defaultSettings, cashOnHand: 300_000 };
		expect(runwayWeeks(defaultSettings, 50_000, now)).toBeNull();
		expect(runwayWeeks(settings, 0, now)).toBeNull();
		expect(runwayWeeks({ ...settings, monthlyCosts: 90_000 }, 0, now)).toBe(14);
		// 75,000 spent by the 15th → 150,000 a month → 35,000 a week.
		expect(runwayWeeks(settings, 75_000, now)).toBe(8);
	});

	test("writes today's line and a tip the data backs up", () => {
		expect(todayLine(defaultSettings, 1, true)).toBe(
			"Today · 2 applications, 1 follow-up, 30 min skill",
		);
		expect(careerTip([], now, defaultSettings)).toContain("Paste a job link");
		expect(careerTip(apps, now, defaultSettings)).toContain("1 follow-up is due");
	});
});

const session = (date: string): SkillSession => ({
	id: `w1d${date.slice(-1)}`,
	date,
	minutes: 30,
	status: "done",
	week: 1,
	day: 0,
});

describe("skill block", () => {
	const plan = parseSkillPlan({
		id: "plan",
		title: "System design",
		startedOn: "2026-10-05",
		weeks: [
			{ title: "Sync", goal: "", days: [{ title: "Mon", detail: "" }] },
			{ title: "Caching", goal: "", days: [{ title: "Mon", detail: "" }] },
		],
	});

	test("knows the plan week and weekday", () => {
		expect(plan).not.toBeNull();
		if (!plan) return;
		expect(planWeek(plan, now)).toBe(1);
		expect(planWeek(plan, new Date(2027, 0, 1))).toBe(1);
		expect(weekdayIndex(now)).toBe(3);
		expect(weekdayIndex(new Date(2026, 9, 17))).toBeNull();
	});

	test("counts the streak back from today or yesterday", () => {
		expect(skillStreak([session("2026-10-14"), session("2026-10-13")], now)).toBe(2);
		expect(skillStreak([session("2026-10-15"), session("2026-10-14")], now)).toBe(2);
		expect(skillStreak([session("2026-10-12")], now)).toBe(0);
	});

	test("builds the activity grid oldest first", () => {
		const cells = skillActivity([session("2026-10-15")], now, 3);
		expect(cells).toEqual(["missed", "missed", "done"]);
	});
});

describe("flashcards", () => {
	const card = {
		id: "c",
		deckId: "a",
		topic: "React",
		tag: "React",
		front: "Q",
		back: "A",
		code: "",
		dueAt: iso(-1),
		intervalMinutes: 0,
		reps: 0,
	};

	test("schedules new cards 1m / 6m / 1d / 4d and grows reviewed ones", () => {
		expect(
			["again", "hard", "good", "easy"].map((rating) =>
				formatInterval(nextInterval(card, rating as never)),
			),
		).toEqual(["1m", "6m", "1d", "4d"]);
		const reviewed = review(card, "good", now);
		expect(reviewed.reps).toBe(1);
		expect(nextInterval(reviewed, "good")).toBe(2 * 24 * 60);
		expect(review(reviewed, "again", now).reps).toBe(0);
	});

	test("lists due cards", () => {
		expect(dueCards([card, { ...card, id: "later", dueAt: iso(3) }], now).map((c) => c.id)).toEqual(
			["c"],
		);
	});
});

describe("parseCareerLine", () => {
	test("reads the Figma example", () => {
		expect(parseCareerLine("applied to tessera, senior typescript, 500k, remote")).toEqual({
			application: {
				company: "Tessera",
				role: "Senior Typescript",
				pay: "500k",
				where: "Remote",
				stage: "applied",
			},
			followUpInDays: 7,
		});
	});

	test("knows other stages and ignores lines that are not about jobs", () => {
		expect(parseCareerLine("saved orbit labs, react native")?.application?.stage).toBe("saved");
		expect(parseCareerLine("interview with Helio")?.application?.company).toBe("Helio");
		expect(parseCareerLine("drink water").application).toBeNull();
	});

	test("spots links", () => {
		expect(looksLikeLink("northwindlabs.io/careers/senior-frontend")).toBe(true);
		expect(looksLikeLink("applied to tessera")).toBe(false);
		expect(normaliseLink("northwindlabs.io/x")).toBe("https://northwindlabs.io/x");
	});
});
