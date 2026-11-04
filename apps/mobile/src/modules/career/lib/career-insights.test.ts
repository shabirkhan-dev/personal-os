/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { careerNotes, careerRecap, rangeBounds } from "./career-insights";
import { type Application, defaultSettings, type SkillSession } from "./career-model";

// Thursday 15 Oct 2026, 10:00 local time. Monday is the 12th.
const now = new Date(2026, 9, 15, 10, 0);
const iso = (days: number, hours = 9) => new Date(2026, 9, 15 + days, hours).toISOString();

function app(partial: Partial<Application> & { id: string }): Application {
	return {
		company: partial.id,
		role: "Frontend",
		pay: "",
		where: "Remote",
		cv: "",
		link: "",
		notes: "",
		stage: "applied",
		halal: { status: "unsure", note: "", confirmed: false },
		contact: null,
		interview: null,
		followUpAt: null,
		events: [],
		createdAt: iso(-40),
		...partial,
	};
}

const applied = (id: string, days: number, more: Partial<Application> = {}) =>
	app({ id, events: [{ at: iso(days), kind: "applied", note: "" }], ...more });

const session = (date: string, minutes = 30): SkillSession => ({
	id: date,
	date,
	minutes,
	status: "done",
	week: 1,
	day: 1,
});

describe("career insights", () => {
	test("ranges run Monday to now, last week, and the month so far", () => {
		expect(rangeBounds("week", now).start.getDate()).toBe(12);
		const last = rangeBounds("last", now);
		expect([last.start.getDate(), last.end.getDate()]).toEqual([5, 12]);
		expect(rangeBounds("month", now).start.getDate()).toBe(1);
	});

	test("recaps applications, replies and skill minutes in the range", () => {
		const apps = [
			applied("a", -1),
			applied("b", -2, {
				stage: "interview",
				events: [
					{ at: iso(-2), kind: "applied", note: "" },
					{ at: iso(0, 8), kind: "interview", note: "" },
				],
			}),
			applied("c", -8),
		];
		const sessions = [session("2026-10-13"), session("2026-10-14", 20), session("2026-10-06")];
		const week = careerRecap(apps, sessions, defaultSettings, "week", now);
		expect(week).toMatchObject({ applied: 2, replies: 1, skillMinutes: 50, target: 10 });
		const last = careerRecap(apps, sessions, defaultSettings, "last", now);
		expect(last).toMatchObject({ applied: 1, replies: 0, skillMinutes: 30 });
		expect(careerRecap(apps, sessions, defaultSettings, "month", now).target).toBe(40);
	});

	test("notices a near interview without prep, due follow-ups and a slow week", () => {
		const apps = [
			applied("a", -1, {
				stage: "interview",
				interview: { at: iso(2, 15), round: "Tech", minutes: 60, interviewers: 2 },
			}),
			applied("b", -9, { followUpAt: iso(-1) }),
		];
		const notes = careerNotes({ apps, preps: [], settings: defaultSettings, now });
		expect(notes.map((note) => note.kind)).toEqual(["prep", "follow-ups", "behind"]);
	});

	test("flags no replies after eight applications in a month, and nothing for a fresh start", () => {
		const many = Array.from({ length: 8 }, (_, index) => applied(`x${index}`, -index));
		const kinds = careerNotes({ apps: many, preps: [], settings: defaultSettings, now }).map(
			(note) => note.kind,
		);
		expect(kinds).toContain("no-replies");
		const monday = new Date(2026, 9, 12, 10, 0);
		expect(careerNotes({ apps: [], preps: [], settings: defaultSettings, now: monday })).toEqual(
			[],
		);
	});
});
